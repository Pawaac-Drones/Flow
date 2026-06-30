# PawaacFlow WhatsApp Setup Guide

This guide walks you through registering a WhatsApp number end-to-end for use with PawaacFlow's AI task management layer.

## Prerequisites

- A dedicated phone number for WhatsApp (not your personal number)
- A smartphone with WhatsApp installed on the dedicated number
- PawaacFlow instance running (see README.md for setup)
- Access to the server where PawaacFlow is deployed

## Step 1: Prepare Your WhatsApp Number

1. **Get a dedicated phone number** - Use a separate SIM card or virtual number service. This will be your "bot" number that team members message to manage tasks.

2. **Install WhatsApp** on a phone with the dedicated SIM card:
   - Download WhatsApp from Play Store or App Store
   - Verify the phone number via SMS
   - Complete the profile setup (name it "PawaacFlow Bot" or similar)

3. **Important**: This number will be linked to OpenWA. While linked, you cannot use WhatsApp normally on this device. Consider using a secondary device.

## Step 2: Configure OpenWA

OpenWA is the self-hosted WhatsApp Web gateway that PawaacFlow uses to send and receive messages.

### 2.1 Verify OpenWA is Running

```bash
# Check that the OpenWA container is running
docker-compose ps openwa

# View OpenWA logs
docker-compose logs -f openwa
```

### 2.2 Access the OpenWA Dashboard

Open http://your-server-ip:8080 in your browser. You should see the OpenWA management interface.

### 2.3 Scan the QR Code

1. Open WhatsApp on the phone with your dedicated number
2. Go to Settings > Linked Devices > Link a Device
3. Scan the QR code displayed on the OpenWA dashboard
4. Wait for the connection to establish (this may take 30-60 seconds)
5. The dashboard should show "Connected" status

### 2.4 Verify the Connection

Test the connection by sending a message to the bot number from another phone. You should see the message appear in OpenWA's logs:

```bash
docker-compose logs -f openwa | grep "message.received"
```

## Step 3: Configure the Webhook

The webhook tells OpenWA where to send incoming messages.

### 3.1 Set Environment Variables

In your `.env` file:

```env
OPENWA_API_URL=http://openwa:8080
OPENWA_API_KEY=your-openwa-api-key
OPENWA_WEBHOOK_SECRET=a-random-secret-string
```

### 3.2 Verify Webhook Configuration

The `docker-compose.yml` configures OpenWA to send `message.received` events to:
```
http://backend:4000/api/openwa/webhook
```

This is set via the `WA_WEBHOOK_URL` environment variable in the OpenWA service.

### 3.3 Test the Webhook

Send a test message to the bot number and check backend logs:

```bash
docker-compose logs -f backend | grep -i "openwa"
```

You should see the incoming message being processed.

> Note: the WhatsApp/OpenWA layer only runs when `OPENWA_ENABLED=true` is set
> for the backend. Leave it unset to run PawaacFlow without WhatsApp.

## Step 4: Register Team Members

For a user to interact with PawaacFlow via WhatsApp, their phone number must be
mapped to their PawaacFlow account and verified.

### 4.1 Link Your Number (Web Interface)

1. Log in to PawaacFlow
2. Open **WhatsApp** in the sidebar (`/settings/whatsapp`)
3. Enter your WhatsApp number in international format (e.g. `+919876543210`) and click **Link**
4. A 6-digit verification code is shown for the pending number

### 4.2 Link Your Number (API)

```bash
curl -X POST http://localhost:4000/api/openwa/whatsapp-users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "phoneNumber": "+919876543210"
  }'
```

The response includes the generated `verificationCode`. The number is linked to
the **currently authenticated user** (no `userId` is required or accepted). The
phone number is normalized to digits only on the server.

### 4.3 Verify the Number

1. From the WhatsApp account you just linked, message the PawaacFlow bot number
2. Send the 6-digit code shown in the web app (or returned by the API)
3. The bot replies confirming the number is verified

Only verified numbers can run task commands. To list or remove your linked
numbers, use `GET /api/openwa/whatsapp-users/me` and
`DELETE /api/openwa/whatsapp-users/:id`.

## Step 5: Configure the LLM

The LLM parses natural language messages into structured task operations.

### 5.1 Set LLM Environment Variables

```env
LLM_PROVIDER=openai
LLM_API_KEY=sk-your-api-key
LLM_MODEL=gpt-4o-mini
LLM_BASE_URL=https://api.openai.com/v1
```

### 5.2 Supported LLM Providers

| Provider | LLM_BASE_URL | Notes |
|----------|-------------|-------|
| OpenAI | https://api.openai.com/v1 | Recommended for best results |
| Azure OpenAI | https://your-resource.openai.azure.com/ | Enterprise option |
| Ollama (local) | http://localhost:11434/v1 | Free, requires GPU |
| vLLM (local) | http://localhost:8000/v1 | High throughput |

### 5.3 Test the LLM Integration

After configuring, send a test message to the bot:

```
what tasks are assigned to me?
```

The bot should reply with your current task list or a message indicating no tasks found.

## Step 6: Verify End-to-End Flow

Test the complete flow:

1. **Create a project** in the web interface (e.g., key "TEST")

2. **Send a WhatsApp message** to the bot number:
   ```
   create task: test whatsapp integration, priority high, assign to me
   ```

3. **Expected reply** from the bot:
   ```
   Created TEST-1: test whatsapp integration (Priority: High, Assigned to: You)
   ```

4. **Verify in web interface** that the task appears on the board

5. **Try updating**:
   ```
   mark TEST-1 as in progress
   ```

6. **Expected reply**:
   ```
   Done! Marked TEST-1 as In Progress
   ```

## Step 7: Enable Daily Digest (Optional)

Team members can opt in to receive their open tasks each morning.

### Via WhatsApp:
```
enable daily digest
```

### Via Web Interface:
1. Open **WhatsApp** in the sidebar (`/settings/whatsapp`)
2. For a verified number, click **Enable** under "Daily digest"
   (the digest is sent each morning; the default time is 09:00)

### Daily Digest Format:
```
Good morning! Here are your open tasks for today:

In Progress:
- TEST-1: Fix API timeout [High] (Due: Today)
- TEST-3: Update documentation [Medium]

To Do:
- TEST-5: Add unit tests [Low] (Due: Tomorrow)

Total: 3 tasks
```

## Troubleshooting

### QR Code Not Appearing
- Restart the OpenWA container: `docker-compose restart openwa`
- Check logs: `docker-compose logs openwa`
- Ensure port 8080 is accessible

### Messages Not Being Received
- Verify webhook URL is correct in OpenWA config
- Check that backend is reachable from OpenWA container
- Verify the phone number is registered in PawaacFlow
- Check backend logs for errors

### Bot Not Responding
- Verify LLM API key is valid
- Check LLM_BASE_URL is accessible from the backend container
- Review backend logs: `docker-compose logs backend`
- Ensure the user's phone number is verified in the system

### "Not Registered" Reply
- The sender's phone number is not mapped to any PawaacFlow user
- Register the number via admin panel or API (see Step 4)

### Session Disconnected
- WhatsApp sessions can expire if not used for extended periods
- Re-scan the QR code via the OpenWA dashboard
- The session is persisted in a Docker volume (`openwa_session`)

## Security Considerations

- Only registered phone numbers can trigger actions
- Unrecognized numbers receive a polite "not registered" reply
- Webhook requests are verified using a shared secret
- All actions are logged in the activity trail
- The LLM receives only the current message content, not full conversation history
- No WhatsApp message content is stored permanently (only the resulting actions)

## Network Requirements

For production deployments, ensure:
- The OpenWA container can reach WhatsApp servers (web.whatsapp.com)
- The backend can reach your LLM provider's API
- The webhook endpoint is accessible only from the OpenWA container (internal Docker network)
- HTTPS is configured for any external-facing endpoints

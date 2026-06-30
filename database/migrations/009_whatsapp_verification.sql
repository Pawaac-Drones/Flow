-- Add verification code support to whatsapp_users
-- Used by the self-service WhatsApp linking + verification flow:
-- a user links a number (unverified) and receives a code, then sends the
-- code to the bot via WhatsApp to confirm ownership of the number.
ALTER TABLE whatsapp_users
    ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10);

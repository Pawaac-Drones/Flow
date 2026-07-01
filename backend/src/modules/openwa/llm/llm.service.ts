import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getToolSchemas } from './llm-tools';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface LlmResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      tool_calls?: ToolCall[];
    };
    finish_reason: string;
  }>;
}

export interface LlmResult {
  toolCalls: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  textResponse: string | null;
  rawToolCalls?: ToolCall[];
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>(
      'LLM_API_URL',
      'https://api.openai.com/v1',
    );
    this.apiKey = this.configService.get<string>('LLM_API_KEY', '');
    this.model = this.configService.get<string>('LLM_MODEL', 'gpt-4o-mini');
  }

  async processMessage(
    userMessage: string,
    userName: string,
    context?: string,
  ): Promise<LlmResult> {
    const systemPrompt = this.buildSystemPrompt(userName, context);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    try {
      const response = await this.callApi(messages);
      return this.parseResponse(response);
    } catch (error) {
      this.logger.error('LLM API call failed:', error);
      return {
        toolCalls: [],
        textResponse:
          'Sorry, I encountered an error processing your request. Please try again.',
      };
    }
  }

  async processWithToolResults(
    userMessage: string,
    userName: string,
    toolResults: Array<{ id: string; result: string }>,
    assistantMessage?: { tool_calls: ToolCall[] },
    context?: string,
  ): Promise<LlmResult> {
    const systemPrompt = this.buildSystemPrompt(userName, context);
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    // Include the assistant message with tool_calls before tool results
    // (required by the OpenAI API)
    if (assistantMessage) {
      messages.push({
        role: 'assistant',
        content: null,
        tool_calls: assistantMessage.tool_calls,
      });
    }

    for (const result of toolResults) {
      messages.push({
        role: 'tool',
        content: result.result,
        tool_call_id: result.id,
      });
    }

    try {
      const response = await this.callApi(messages);
      return this.parseResponse(response);
    } catch (error) {
      this.logger.error('LLM API call with tool results failed:', error);
      return {
        toolCalls: [],
        textResponse:
          'Sorry, I encountered an error processing the results. Please try again.',
      };
    }
  }

  private buildSystemPrompt(userName: string, context?: string): string {
    let prompt = `You are PawaacFlow Assistant, an AI helper for project and task management. You help team members manage their tasks via WhatsApp.

Current user: ${userName}

You can help users:
- Create new tasks
- Update task statuses (backlog, todo, in_progress, in_review, done)
- Assign tasks to team members
- Query and search tasks
- Get pending tasks for the current user

When the user asks to do something task-related, use the appropriate tool/function. Be concise in your responses since this is WhatsApp messaging.

Task status values: backlog, todo, in_progress, in_review, done
Priority values: lowest, low, medium, high, highest

Always confirm actions with a brief response. Use task keys (like PROJ-123) when referencing tasks.`;

    if (context) {
      prompt += `\n\nAdditional context:\n${context}`;
    }

    return prompt;
  }

  private async callApi(messages: ChatMessage[]): Promise<LlmResponse> {
    const url = `${this.apiUrl}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        tools: getToolSchemas(),
        tool_choice: 'auto',
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  private parseResponse(response: LlmResponse): LlmResult {
    const choice = response.choices?.[0];
    if (!choice) {
      return { toolCalls: [], textResponse: 'No response from AI.' };
    }

    const message = choice.message;
    const toolCalls: LlmResult['toolCalls'] = [];

    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const tc of message.tool_calls) {
        try {
          const args = JSON.parse(tc.function.arguments);
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: args,
          });
        } catch (error) {
          this.logger.warn(
            `Failed to parse tool call arguments: ${tc.function.arguments}`,
          );
        }
      }
    }

    return {
      toolCalls,
      textResponse: message.content || null,
      rawToolCalls:
        message.tool_calls && message.tool_calls.length > 0
          ? message.tool_calls
          : undefined,
    };
  }
}

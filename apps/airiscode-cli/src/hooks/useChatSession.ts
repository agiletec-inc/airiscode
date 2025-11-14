/**
 * useChatSession Hook
 *
 * Manages chat session with LLM driver and MCP tool execution loop.
 * Implements the core conversation flow:
 * 1. User sends message
 * 2. LLM processes and may request tools
 * 3. Tools executed via MCP
 * 4. Results sent back to LLM
 * 5. LLM continues until done
 */

import { useState, useRef, useCallback } from 'react';
import type { ModelDriver, ChatMessage, ChatRequest, ToolCall } from '@airiscode/drivers';
import type { MCPSessionManager } from '@airiscode/mcp-session';
import { ApprovalsLevel, TrustLevel } from '@airiscode/policies';

export interface ChatSessionConfig {
  sessionId: string;
  workingDir: string;
  driver: ModelDriver;
  mcpSession?: MCPSessionManager;
  systemPrompt?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: Array<{ toolName: string; result: string }>;
  streaming?: boolean;
}

export interface UseChatSessionReturn {
  messages: ConversationMessage[];
  isProcessing: boolean;
  currentResponse: string;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
}

export function useChatSession(config: ChatSessionConfig): UseChatSessionReturn {
  const { sessionId, workingDir, driver, mcpSession, systemPrompt } = config;

  const [messages, setMessages] = useState<ConversationMessage[]>(() => {
    if (systemPrompt) {
      return [
        {
          id: `system-${Date.now()}`,
          role: 'system',
          content: systemPrompt,
          timestamp: new Date(),
        },
      ];
    }
    return [];
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const conversationRef = useRef<ChatMessage[]>([]);

  /**
   * Execute tool calls via MCP
   */
  const executeToolCalls = async (toolCalls: ToolCall[]): Promise<ChatMessage[]> => {
    if (!mcpSession) {
      // No MCP session, return error messages
      return toolCalls.map((tc) => ({
        role: 'tool',
        content: JSON.stringify({
          error: 'MCP session not available',
          toolName: tc.name,
        }),
        toolCallId: tc.id,
      }));
    }

    const results: ChatMessage[] = [];

    for (const toolCall of toolCalls) {
      try {
        // Check if this is a lazy server tool
        const allTools = mcpSession.getAllTools();
        const tool = allTools.find((t) => t.name === toolCall.name);

        if (!tool) {
          // Tool not found, might need to enable lazy server
          // Extract server name from tool name (e.g., "playwright_click" -> "playwright")
          const serverName = toolCall.name.split('_')[0];

          try {
            await mcpSession.enableLazyServer(serverName);
          } catch (error) {
            results.push({
              role: 'tool',
              content: JSON.stringify({
                error: `Tool ${toolCall.name} not available and lazy server ${serverName} failed to load`,
                details: error instanceof Error ? error.message : String(error),
              }),
              toolCallId: toolCall.id,
            });
            continue;
          }
        }

        // Extract server name and tool name
        // MCP tools are namespaced: "mcp__<server>__<tool>"
        const match = toolCall.name.match(/^mcp__([^_]+)__(.+)$/);
        if (!match) {
          results.push({
            role: 'tool',
            content: JSON.stringify({
              error: `Invalid tool name format: ${toolCall.name}`,
            }),
            toolCallId: toolCall.id,
          });
          continue;
        }

        const [, serverName, toolName] = match;

        // Invoke tool via MCP
        const result = await mcpSession.invokeTool(serverName, toolName, toolCall.arguments);

        results.push({
          role: 'tool',
          content: JSON.stringify(result),
          toolCallId: toolCall.id,
        });

        // Add UI message for visibility
        setMessages((prev) => [
          ...prev,
          {
            id: `tool-${toolCall.id}`,
            role: 'tool',
            content: `Executed: ${toolCall.name}`,
            timestamp: new Date(),
            toolResults: [{ toolName: toolCall.name, result: JSON.stringify(result, null, 2) }],
          },
        ]);
      } catch (error) {
        results.push({
          role: 'tool',
          content: JSON.stringify({
            error: 'Tool execution failed',
            details: error instanceof Error ? error.message : String(error),
          }),
          toolCallId: toolCall.id,
        });
      }
    }

    return results;
  };

  /**
   * Tool execution loop
   * Continues calling LLM until no more tool calls
   */
  const runToolExecutionLoop = async (
    initialMessages: ChatMessage[],
    tools: ChatRequest['tools']
  ): Promise<string> => {
    let messages = [...initialMessages];
    let finalText = '';
    const maxIterations = 10; // Prevent infinite loops
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      // Call LLM
      const response = await driver.chat({
        sessionId,
        messages,
        tools,
        policy: {
          approvals: ApprovalsLevel.NEVER,
          trust: TrustLevel.SANDBOXED,
        },
        temperature: 0.7,
      });

      finalText = response.text;

      // No tool calls, we're done
      if (!response.toolCalls || response.toolCalls.length === 0) {
        return finalText;
      }

      // Add assistant message with tool calls
      messages.push({
        role: 'assistant',
        content: response.text || '',
      });

      // Execute tools
      const toolResults = await executeToolCalls(response.toolCalls);

      // Add tool results to conversation
      messages.push(...toolResults);

      // Update conversation ref
      conversationRef.current = messages;
    }

    return finalText + '\n\n(Tool execution loop limit reached)';
  };

  /**
   * Send user message and process response
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (isProcessing || !driver) return;

      setIsProcessing(true);
      setCurrentResponse('');

      try {
        // Add user message
        const userMessage: ConversationMessage = {
          id: `user-${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // Build conversation history
        const chatMessages: ChatMessage[] = conversationRef.current.length > 0
          ? conversationRef.current
          : messages
              .filter((m) => m.role !== 'tool')
              .map((m) => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
              }));

        // Add new user message
        chatMessages.push({
          role: 'user',
          content,
        });

        // Get MCP tools if available
        const tools = mcpSession
          ? mcpSession.getAllTools().map((t) => ({
              name: `mcp__${t.serverName || 'unknown'}__${t.name}`,
              description: t.description,
              parameters: t.inputSchema,
            }))
          : undefined;

        // Run tool execution loop
        const responseText = await runToolExecutionLoop(chatMessages, tools);

        // Add assistant response
        const assistantMessage: ConversationMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Update conversation ref
        conversationRef.current = [
          ...chatMessages,
          {
            role: 'assistant',
            content: responseText,
          },
        ];
      } catch (error) {
        const errorMessage: ConversationMessage = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, driver, mcpSession, sessionId, messages]
  );

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    setMessages(
      systemPrompt
        ? [
            {
              id: `system-${Date.now()}`,
              role: 'system',
              content: systemPrompt,
              timestamp: new Date(),
            },
          ]
        : []
    );
    conversationRef.current = [];
    setCurrentResponse('');
  }, [systemPrompt]);

  return {
    messages,
    isProcessing,
    currentResponse,
    sendMessage,
    clearHistory,
  };
}

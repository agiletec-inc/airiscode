/**
 * Interactive Chat UI Component
 *
 * Claude Code-style chat interface for airiscode with Ollama + MCP tools
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useApp } from 'ink';
import { TextInput } from '../components/TextInput.js';
import { useTextBuffer } from '../hooks/useTextBuffer.js';
import { KeypressProvider } from '../contexts/KeypressContext.js';
import { OllamaDriver } from '@airiscode/driver-ollama';
import type { MCPSessionManager } from '@airiscode/mcp-session';
import { useChatSession } from '../hooks/useChatSession.js';

export interface ChatAppProps {
  sessionId: string;
  workingDir: string;
  model?: string;
  ollamaUrl?: string;
  mcpSession?: MCPSessionManager;
}

export const ChatApp: React.FC<ChatAppProps> = ({
  sessionId,
  workingDir,
  model = 'qwen2.5:3b',
  ollamaUrl = 'http://localhost:11434',
  mcpSession,
}) => {
  const { exit } = useApp();
  const inputBuffer = useTextBuffer('', 3);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const driverRef = useRef<OllamaDriver | null>(null);

  // Initialize Ollama driver
  useEffect(() => {
    driverRef.current = new OllamaDriver({
      baseUrl: ollamaUrl,
      timeout: 30000,
      defaultModel: model,
    });

    // Check if Ollama is running
    driverRef.current
      .getCapabilities()
      .then(() => {
        setConnectionStatus('connected');
      })
      .catch(() => {
        setConnectionStatus('error');
      });
  }, [ollamaUrl, model]);

  // Initialize chat session with MCP
  const mcpToolsCount = mcpSession ? mcpSession.getAllTools().length : 0;
  const systemPrompt = `AIRIS Code - Ollama Chat
Session: ${sessionId}
Working Directory: ${workingDir}
Model: ${model}
MCP Tools: ${mcpToolsCount > 0 ? `${mcpToolsCount} available` : 'Not available'}

Type your coding task or question. Press Ctrl+C to exit.`;

  const chatSession = useChatSession({
    sessionId,
    workingDir,
    driver: driverRef.current!,
    mcpSession,
    systemPrompt,
  });

  const { messages, isProcessing, currentResponse, sendMessage } = chatSession;

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isProcessing) return;
    inputBuffer.setText('');
    await sendMessage(value);
  };

  return (
    <KeypressProvider>
      <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={1}>
        <Text bold color="cyan">
          AIRIS Code - Ollama Chat with MCP
        </Text>
        {connectionStatus === 'connected' && (
          <Text color="green"> ✓ Connected</Text>
        )}
        {connectionStatus === 'error' && (
          <Text color="red"> ✗ Ollama not available</Text>
        )}
        {mcpToolsCount > 0 && (
          <Text color="blue"> | {mcpToolsCount} MCP tools</Text>
        )}
      </Box>

      {/* Chat Messages */}
      <Box flexDirection="column" marginBottom={1}>
        {messages.map((msg) => (
          <Box key={msg.id} flexDirection="column" marginBottom={1}>
            <Box>
              <Text
                bold
                color={
                  msg.role === 'user'
                    ? 'green'
                    : msg.role === 'assistant'
                      ? 'blue'
                      : msg.role === 'tool'
                        ? 'yellow'
                        : 'gray'
                }
              >
                {msg.role === 'user'
                  ? '❯ You'
                  : msg.role === 'assistant'
                    ? '🤖 Assistant'
                    : msg.role === 'tool'
                      ? '🔧 Tool'
                      : 'ℹ System'}
              </Text>
              <Text dimColor> {msg.timestamp.toLocaleTimeString()}</Text>
            </Box>
            <Box paddingLeft={2}>
              <Text>{msg.content}</Text>
            </Box>
            {/* Tool results */}
            {msg.toolResults && msg.toolResults.length > 0 && (
              <Box paddingLeft={4} flexDirection="column" marginTop={1}>
                {msg.toolResults.map((tr, idx) => (
                  <Box key={idx} flexDirection="column" marginBottom={1}>
                    <Text dimColor>Result from {tr.toolName}:</Text>
                    <Text dimColor>{tr.result.slice(0, 200)}...</Text>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        ))}

        {/* Processing indicator */}
        {isProcessing && (
          <Box flexDirection="column" marginBottom={1}>
            <Box>
              <Text bold color="blue">
                🤖 Assistant
              </Text>
              <Text dimColor> (processing...)</Text>
            </Box>
          </Box>
        )}

        {/* Streaming response */}
        {currentResponse && (
          <Box flexDirection="column" marginBottom={1}>
            <Box>
              <Text bold color="blue">
                🤖 Assistant
              </Text>
              <Text dimColor> (typing...)</Text>
            </Box>
            <Box paddingLeft={2}>
              <Text>{currentResponse}</Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* Connection error message */}
      {connectionStatus === 'error' && (
        <Box borderStyle="single" borderColor="red" paddingX={1} marginBottom={1}>
          <Text color="red">
            ✗ Failed to connect to Ollama. Make sure it's running: brew services start ollama
          </Text>
        </Box>
      )}

      {/* Input Area */}
      <Box borderStyle="single" borderColor="yellow" paddingX={1}>
        <Text bold color="yellow">
          ❯{' '}
        </Text>
        {isProcessing ? (
          <Text dimColor>Processing...</Text>
        ) : (
          <TextInput
            buffer={inputBuffer}
            onSubmit={handleSubmit}
            placeholder="Enter your coding task..."
            focus={!isProcessing}
          />
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          Press Ctrl+C to exit | Model: {model} | Session: {sessionId.slice(0, 8)}
        </Text>
      </Box>
    </Box>
    </KeypressProvider>
  );
};

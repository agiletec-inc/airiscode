/**
 * @license
 * Copyright 2025 AIRIS Code
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useCallback, useMemo } from "react";
import { Box, Text, useApp } from "ink";
import type { ContentGenerator } from "@airiscode/core-gemini";
import { SessionProvider, useSession } from "./contexts/SessionContext.js";
import { UIStateProvider, useUIState } from "./contexts/UIStateContext.js";
import { MCPProvider, useMCP } from "./contexts/MCPContext.js";
import { Composer } from "./components/Composer.js";
import { MessageDisplay } from "./components/MessageDisplay.js";
import { SessionStorage, type Message } from "./sessionStorage.js";

interface EnhancedAppProps {
  contentGenerator: ContentGenerator;
}

const EnhancedAppInner: React.FC<{ contentGenerator: ContentGenerator }> = ({
  contentGenerator,
}) => {
  const { sessionId, messages, addMessage, clearMessages, stats } = useSession();
  const { state, setStreaming, setInputDisabled, setError } = useUIState();
  const { connected, tools, servers, connect, refreshTools, error: mcpError } = useMCP();
  const { exit } = useApp();

  const sessionStorage = useMemo(() => new SessionStorage(sessionId), [sessionId]);

  // Load messages from session on mount
  useEffect(() => {
    const savedMessages = sessionStorage.loadMessages();
    savedMessages.forEach((msg) => addMessage(msg));
  }, [sessionStorage, addMessage]);

  // Save new messages
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      sessionStorage.appendMessage(lastMessage);
    }
  }, [messages, sessionStorage]);

  const handleSlashCommand = useCallback(
    async (command: string) => {
      const cmd = command.toLowerCase().trim();
      const parts = command.trim().split(/\s+/);
      const mainCmd = parts[0].toLowerCase();

      if (cmd === "/clear") {
        clearMessages();
        setError(null);
        setStreaming({ currentContent: "" });
        return true;
      }

      if (cmd === "/help") {
        const helpMessage: Message = {
          role: "assistant",
          content: `Available commands:
/clear - Clear conversation history
/help - Show this help message
/mcp [connect|status|tools] - MCP Gateway commands
/tools - List available MCP tools
/exit, /quit - Exit application

Press Ctrl+C to exit`,
          timestamp: Date.now(),
        };
        addMessage(helpMessage);
        return true;
      }

      if (mainCmd === "/mcp") {
        const subCmd = parts[1]?.toLowerCase();

        if (subCmd === "connect") {
          const url = parts[2] || "http://localhost:3000";
          try {
            await connect(url);
            addMessage({
              role: "assistant",
              content: `✅ Connected to MCP Gateway at ${url}\n${tools.length} tools available`,
              timestamp: Date.now(),
            });
          } catch (err) {
            addMessage({
              role: "assistant",
              content: `❌ Failed to connect: ${err instanceof Error ? err.message : String(err)}`,
              timestamp: Date.now(),
            });
          }
          return true;
        }

        if (subCmd === "status") {
          const status = connected ? "✅ Connected" : "❌ Not connected";
          const serverList = servers.map(s => `  - ${s.name}: ${s.enabled ? "enabled" : "disabled"} (${s.tools.length} tools)`).join("\n");
          addMessage({
            role: "assistant",
            content: `MCP Gateway Status: ${status}\n\nServers:\n${serverList || "  No servers"}`,
            timestamp: Date.now(),
          });
          return true;
        }

        if (subCmd === "tools") {
          if (!connected) {
            addMessage({
              role: "assistant",
              content: "❌ MCP Gateway not connected. Use /mcp connect first.",
              timestamp: Date.now(),
            });
            return true;
          }

          try {
            await refreshTools();
            const toolList = tools.map(t => `  - ${t.name}: ${t.description}`).join("\n");
            addMessage({
              role: "assistant",
              content: `Available Tools (${tools.length}):\n${toolList || "  No tools available"}`,
              timestamp: Date.now(),
            });
          } catch (err) {
            addMessage({
              role: "assistant",
              content: `❌ Failed to refresh tools: ${err instanceof Error ? err.message : String(err)}`,
              timestamp: Date.now(),
            });
          }
          return true;
        }

        addMessage({
          role: "assistant",
          content: "Usage: /mcp [connect|status|tools]\n\nExamples:\n  /mcp connect http://localhost:3000\n  /mcp status\n  /mcp tools",
          timestamp: Date.now(),
        });
        return true;
      }

      if (mainCmd === "/tools") {
        if (!connected) {
          addMessage({
            role: "assistant",
            content: "❌ MCP Gateway not connected. Use /mcp connect first.",
            timestamp: Date.now(),
          });
          return true;
        }

        const toolList = tools.map(t => `  - ${t.name}: ${t.description}`).join("\n");
        addMessage({
          role: "assistant",
          content: `Available Tools (${tools.length}):\n${toolList || "  No tools available"}`,
          timestamp: Date.now(),
        });
        return true;
      }

      if (cmd === "/exit" || cmd === "/quit") {
        exit();
        return true;
      }

      return false;
    },
    [clearMessages, addMessage, exit, setError, setStreaming, connected, tools, servers, connect, refreshTools]
  );

  const handleSubmit = useCallback(
    async (input: string) => {
      // Handle slash commands
      if (input.startsWith("/")) {
        const handled = await handleSlashCommand(input);
        if (handled) return;

        setError(`Unknown command: ${input}. Type /help for available commands.`);
        return;
      }

      setError(null);
      setInputDisabled(true);
      setStreaming({ isStreaming: true, currentContent: "" });

      // Add user message
      const userMessage: Message = {
        role: "user",
        content: input,
        timestamp: Date.now(),
      };
      addMessage(userMessage);

      // Build conversation context
      const conversationMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Stream response
      let buffer = "";
      let fullResponse = "";
      let lastFlushTime = Date.now();
      const FLUSH_INTERVAL_MS = 50;

      const flushBuffer = () => {
        if (buffer.length > 0) {
          fullResponse += buffer;
          setStreaming({ currentContent: fullResponse });
          buffer = "";
          lastFlushTime = Date.now();
        }
      };

      try {
        const stream = await contentGenerator.generateContentStream({
          messages: conversationMessages,
        });

        for await (const chunk of stream) {
          buffer += chunk.content;

          const now = Date.now();
          if (now - lastFlushTime >= FLUSH_INTERVAL_MS || buffer.length > 100) {
            flushBuffer();
          }
        }

        // Final flush
        flushBuffer();

        // Add assistant message
        const assistantMessage: Message = {
          role: "assistant",
          content: fullResponse,
          timestamp: Date.now(),
        };
        addMessage(assistantMessage);
      } catch (error) {
        flushBuffer();
        const errorMsg = `Error: ${error instanceof Error ? error.message : String(error)}`;
        setError(errorMsg);

        // Add error message
        const assistantMessage: Message = {
          role: "assistant",
          content: fullResponse ? `${fullResponse}\n\n${errorMsg}` : errorMsg,
          timestamp: Date.now(),
        };
        addMessage(assistantMessage);
      } finally {
        setStreaming({ isStreaming: false, currentContent: "" });
        setInputDisabled(false);
      }
    },
    [
      messages,
      addMessage,
      contentGenerator,
      handleSlashCommand,
      setError,
      setInputDisabled,
      setStreaming,
    ]
  );

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          AIRIS Code
        </Text>
        {messages.length > 0 && (
          <Text dimColor> ({Math.floor(messages.length / 2)} turns)</Text>
        )}
        {connected && (
          <Text color="green"> | MCP: {tools.length} tools</Text>
        )}
        <Text dimColor> | {sessionId}</Text>
      </Box>

      {/* Error display */}
      {state.error && (
        <Box marginBottom={1} borderStyle="single" borderColor="red" padding={1}>
          <Text color="red">❌ {state.error}</Text>
        </Box>
      )}

      {/* Messages */}
      <Box flexDirection="column" marginBottom={1}>
        <MessageDisplay
          messages={messages}
          maxMessages={6}
          currentStreaming={state.streaming.currentContent}
        />
      </Box>

      {/* Composer */}
      <Box marginTop={1}>
        <Composer
          onSubmit={handleSubmit}
          disabled={state.inputDisabled}
          placeholder={
            connected
              ? "Type message or /tools to list MCP tools (/help for all commands)"
              : "Type message or /mcp connect to enable tools (/help for all commands)"
          }
        />
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          {state.streaming.isStreaming ? "● Streaming..." : `Ready (${stats.messageCount} messages)`}
        </Text>
      </Box>
    </Box>
  );
};

export const EnhancedApp: React.FC<EnhancedAppProps> = ({ contentGenerator }) => {
  const sessionId = useMemo(() => `session-${Date.now()}`, []);

  return (
    <UIStateProvider>
      <MCPProvider autoConnect={false}>
        <SessionProvider sessionId={sessionId}>
          <EnhancedAppInner contentGenerator={contentGenerator} />
        </SessionProvider>
      </MCPProvider>
    </UIStateProvider>
  );
};

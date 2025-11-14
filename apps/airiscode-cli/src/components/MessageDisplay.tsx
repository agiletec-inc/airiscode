/**
 * @license
 * Copyright 2025 AIRIS Code
 * SPDX-License-Identifier: MIT
 */

import React from "react";
import { Box, Text } from "ink";
import type { Message } from "../sessionStorage.js";

export interface MessageDisplayProps {
  messages: Message[];
  maxMessages?: number;
  currentStreaming?: string;
  showTimestamps?: boolean;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({
  messages,
  maxMessages = 10,
  currentStreaming,
  showTimestamps = false,
}) => {
  const recentMessages = messages.slice(-maxMessages);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === "user";
    const color = isUser ? "green" : "blue";
    const label = isUser ? "You" : "Assistant";

    return (
      <Box key={index} flexDirection="column" marginBottom={1}>
        <Box>
          <Text bold color={color}>
            {label}
          </Text>
          {showTimestamps && (
            <Text dimColor> at {formatTimestamp(message.timestamp)}</Text>
          )}
        </Box>
        <Box paddingLeft={2}>
          <Text>{message.content}</Text>
        </Box>
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      {recentMessages.map(renderMessage)}

      {currentStreaming && (
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text bold color="blue">
              Assistant
            </Text>
            <Text color="yellow"> (streaming...)</Text>
          </Box>
          <Box paddingLeft={2} borderStyle="single" borderColor="gray" padding={1}>
            <Text>{currentStreaming}</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};

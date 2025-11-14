/**
 * @license
 * Copyright 2025 AIRIS Code
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

export interface ComposerProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const Composer: React.FC<ComposerProps> = ({
  onSubmit,
  disabled = false,
  placeholder = "Type your message...",
}) => {
  const [input, setInput] = useState("");

  useInput((inputKey, keyInfo) => {
    if (disabled) return;

    if (keyInfo.return) {
      if (input.trim().length > 0) {
        onSubmit(input.trim());
        setInput("");
      }
      return;
    }

    if (keyInfo.backspace || keyInfo.delete) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    if (typeof inputKey === "string" && inputKey.length === 1 && !keyInfo.ctrl && !keyInfo.meta) {
      setInput((prev) => prev + inputKey);
    }
  });

  const isSlashCommand = input.startsWith("/");

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color={isSlashCommand ? "magenta" : "green"}>
          {isSlashCommand ? "/" : ">"}{" "}
        </Text>
        <Text color={isSlashCommand ? "magenta" : undefined}>{input}</Text>
        {!disabled && <Text color="gray">_</Text>}
      </Box>
      {input.length === 0 && !disabled && (
        <Box marginTop={1}>
          <Text dimColor>{placeholder}</Text>
        </Box>
      )}
      {isSlashCommand && input.length > 1 && (
        <Box marginTop={1}>
          <Text dimColor>Slash command detected. Available: /clear, /help</Text>
        </Box>
      )}
    </Box>
  );
};

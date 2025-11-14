/**
 * @license
 * Copyright 2025 AIRIS Code
 * SPDX-License-Identifier: MIT
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { Message } from "../sessionStorage.js";

export interface SessionStats {
  messageCount: number;
  totalTokens?: number;
  startTime: number;
}

export interface SessionContextType {
  sessionId: string;
  messages: Message[];
  stats: SessionStats;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  updateStats: (stats: Partial<SessionStats>) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export interface SessionProviderProps {
  sessionId: string;
  initialMessages?: Message[];
  children: React.ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  sessionId,
  initialMessages = [],
  children,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [stats, setStats] = useState<SessionStats>({
    messageCount: initialMessages.length,
    startTime: Date.now(),
  });

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
    setStats((prev) => ({ ...prev, messageCount: prev.messageCount + 1 }));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStats({ messageCount: 0, startTime: Date.now() });
  }, []);

  const updateStats = useCallback((newStats: Partial<SessionStats>) => {
    setStats((prev) => ({ ...prev, ...newStats }));
  }, []);

  const value = useMemo(
    () => ({
      sessionId,
      messages,
      stats,
      addMessage,
      clearMessages,
      updateStats,
    }),
    [sessionId, messages, stats, addMessage, clearMessages, updateStats]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

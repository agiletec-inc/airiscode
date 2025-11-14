/**
 * @license
 * Copyright 2025 AIRIS Code
 * SPDX-License-Identifier: MIT
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { MCPGatewayClient } from "@airiscode/mcp-gateway-client";
import type { ToolDescription, ServerInfo } from "@airiscode/mcp-gateway-client";

export interface MCPContextType {
  client: MCPGatewayClient | null;
  connected: boolean;
  tools: ToolDescription[];
  servers: ServerInfo[];
  connect: (baseURL: string, apiKey?: string) => Promise<void>;
  disconnect: () => void;
  invokeTool: (serverName: string, toolName: string, args: Record<string, unknown>) => Promise<unknown>;
  refreshTools: () => Promise<void>;
  error: string | null;
}

const MCPContext = createContext<MCPContextType | undefined>(undefined);

export interface MCPProviderProps {
  autoConnect?: boolean;
  defaultBaseURL?: string;
  children: React.ReactNode;
}

export const MCPProvider: React.FC<MCPProviderProps> = ({
  autoConnect = false,
  defaultBaseURL = "http://localhost:3000",
  children,
}) => {
  const [client, setClient] = useState<MCPGatewayClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [tools, setTools] = useState<ToolDescription[]>([]);
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (baseURL: string, apiKey?: string) => {
    try {
      setError(null);
      const newClient = new MCPGatewayClient({ baseURL, apiKey });

      // Test connection
      const status = await newClient.getStatus();

      setClient(newClient);
      setConnected(true);
      setServers(status.servers);

      // Get always-on tools
      const alwaysOnTools = await newClient.getAlwaysOnTools();
      setTools(alwaysOnTools);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setConnected(false);
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    setClient(null);
    setConnected(false);
    setTools([]);
    setServers([]);
    setError(null);
  }, []);

  const invokeTool = useCallback(
    async (serverName: string, toolName: string, args: Record<string, unknown>) => {
      if (!client) {
        throw new Error("MCP Gateway not connected");
      }

      try {
        setError(null);
        return await client.invokeTool(serverName, toolName, args);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        throw err;
      }
    },
    [client]
  );

  const refreshTools = useCallback(async () => {
    if (!client) {
      throw new Error("MCP Gateway not connected");
    }

    try {
      setError(null);
      const status = await client.getStatus();
      setServers(status.servers);

      const alwaysOnTools = await client.getAlwaysOnTools();
      setTools(alwaysOnTools);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, [client]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect(defaultBaseURL).catch(() => {
        // Silently fail - MCP Gateway is optional
      });
    }
  }, [autoConnect, defaultBaseURL, connect]);

  const value = useMemo(
    () => ({
      client,
      connected,
      tools,
      servers,
      connect,
      disconnect,
      invokeTool,
      refreshTools,
      error,
    }),
    [client, connected, tools, servers, connect, disconnect, invokeTool, refreshTools, error]
  );

  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
};

export const useMCP = (): MCPContextType => {
  const context = useContext(MCPContext);
  if (!context) {
    throw new Error("useMCP must be used within an MCPProvider");
  }
  return context;
};

/**
 * @license
 * Copyright 2025 AIRIS Code
 * SPDX-License-Identifier: MIT
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

export interface StreamingState {
  isStreaming: boolean;
  currentContent: string;
}

export interface UIState {
  isLoading: boolean;
  error: string | null;
  streaming: StreamingState;
  inputDisabled: boolean;
}

export interface UIStateContextType {
  state: UIState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStreaming: (streaming: Partial<StreamingState>) => void;
  setInputDisabled: (disabled: boolean) => void;
  resetState: () => void;
}

const initialUIState: UIState = {
  isLoading: false,
  error: null,
  streaming: {
    isStreaming: false,
    currentContent: "",
  },
  inputDisabled: false,
};

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export interface UIStateProviderProps {
  children: React.ReactNode;
}

export const UIStateProvider: React.FC<UIStateProviderProps> = ({ children }) => {
  const [state, setState] = useState<UIState>(initialUIState);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setStreaming = useCallback((streaming: Partial<StreamingState>) => {
    setState((prev) => ({
      ...prev,
      streaming: { ...prev.streaming, ...streaming },
    }));
  }, []);

  const setInputDisabled = useCallback((disabled: boolean) => {
    setState((prev) => ({ ...prev, inputDisabled: disabled }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialUIState);
  }, []);

  const value = useMemo(
    () => ({
      state,
      setLoading,
      setError,
      setStreaming,
      setInputDisabled,
      resetState,
    }),
    [state, setLoading, setError, setStreaming, setInputDisabled, resetState]
  );

  return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
};

export const useUIState = (): UIStateContextType => {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error("useUIState must be used within a UIStateProvider");
  }
  return context;
};

/**
 * useTextBuffer Hook
 *
 * Creates and manages a TextBuffer instance for text input
 */

import { useMemo } from 'react';
import { useTextBuffer as useTextBufferImpl, type TextBuffer } from '../components/text-buffer.js';

export function useTextBuffer(initialText: string = '', maxHeight: number = 10): TextBuffer {
  return useTextBufferImpl(initialText, maxHeight);
}

export type { TextBuffer };

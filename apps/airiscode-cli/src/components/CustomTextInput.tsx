/**
 * Custom Text Input Component with Multibyte Character Support
 *
 * Replaces ink-text-input to properly handle:
 * - Japanese IME input
 * - Multibyte character editing (backspace, delete)
 * - Correct cursor positioning for CJK characters
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import stringWidth from 'string-width';

export interface CustomTextInputProps {
  value: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  disabled?: boolean;
  focus?: boolean;
  showCursor?: boolean;
  cursorColor?: string;
}

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  value: externalValue,
  placeholder = '',
  onChange,
  onSubmit,
  disabled = false,
  focus = true,
  showCursor = true,
  cursorColor = 'cyan',
}) => {
  const [cursorOffset, setCursorOffset] = useState(externalValue.length);

  // Sync cursor position when external value changes
  useEffect(() => {
    setCursorOffset(externalValue.length);
  }, [externalValue]);

  useInput(
    (input, key) => {
      if (disabled || !focus) return;

      // Submit on Enter
      if (key.return) {
        onSubmit?.(externalValue);
        return;
      }

      // Handle Ctrl+C separately (let parent handle)
      if (key.ctrl && input === 'c') {
        return;
      }

      let newValue = externalValue;
      let newCursor = cursorOffset;

      // Handle backspace
      if (key.backspace || key.delete) {
        if (cursorOffset > 0) {
          // Remove character before cursor
          newValue =
            externalValue.slice(0, cursorOffset - 1) +
            externalValue.slice(cursorOffset);
          newCursor = cursorOffset - 1;
        }
      }
      // Handle left arrow
      else if (key.leftArrow) {
        newCursor = Math.max(0, cursorOffset - 1);
      }
      // Handle right arrow
      else if (key.rightArrow) {
        newCursor = Math.min(externalValue.length, cursorOffset + 1);
      }
      // Handle Ctrl+A (Home equivalent)
      else if (key.ctrl && input === 'a') {
        newCursor = 0;
      }
      // Handle Ctrl+E (End equivalent)
      else if (key.ctrl && input === 'e') {
        newCursor = externalValue.length;
      }
      // Handle regular character input
      else if (input && !key.ctrl && !key.meta) {
        // Insert character at cursor position
        newValue =
          externalValue.slice(0, cursorOffset) +
          input +
          externalValue.slice(cursorOffset);
        newCursor = cursorOffset + input.length;
      }

      // Update state
      if (newValue !== externalValue) {
        onChange?.(newValue);
      }
      if (newCursor !== cursorOffset) {
        setCursorOffset(newCursor);
      }
    },
    { isActive: !disabled && focus }
  );

  // Render input with cursor
  const renderValue = () => {
    const displayValue = externalValue || placeholder;
    const isPlaceholder = !externalValue && placeholder;

    if (!showCursor || !focus) {
      return (
        <Text dimColor={isPlaceholder ? true : undefined}>
          {displayValue}
        </Text>
      );
    }

    // Split text at cursor position
    const before = externalValue.slice(0, cursorOffset);
    const after = externalValue.slice(cursorOffset);

    // Calculate visual width for proper cursor positioning
    const beforeWidth = stringWidth(before);

    return (
      <Text>
        {isPlaceholder ? (
          <Text dimColor>{placeholder}</Text>
        ) : (
          <>
            <Text>{before}</Text>
            <Text color={cursorColor} inverse>
              {after[0] || ' '}
            </Text>
            <Text>{after.slice(1)}</Text>
          </>
        )}
      </Text>
    );
  };

  return <Box>{renderValue()}</Box>;
};

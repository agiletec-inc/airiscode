/**
 * Utility functions for path handling
 */

// Shell special characters that might be escaped
const SHELL_SPECIAL_CHARS = /[ ()<>|&;$`"'\\]/;

/**
 * Unescapes shell-escaped characters in a file path
 * @param filePath - The escaped file path
 * @returns The unescaped file path
 */
export function unescapePath(filePath: string): string {
  return filePath.replace(
    new RegExp(`\\\\([${SHELL_SPECIAL_CHARS.source.slice(1, -1)}])`, 'g'),
    '$1',
  );
}

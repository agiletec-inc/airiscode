import { describe, it, expect } from 'vitest';
import { ok, err } from '../src/common.js';

describe('@airiscode/types', () => {
  it('should export common types', () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it('should handle error results', () => {
    const result = err(new Error('test error'));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('test error');
    }
  });
});

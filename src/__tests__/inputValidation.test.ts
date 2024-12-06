import { describe, it, expect } from 'vitest';
import validator from 'validator';

describe('Input Validation', () => {
  it('should accept valid ASCII input', () => {
    const input = 'Hello, how are you?';
    expect(validator.isAscii(input)).toBe(true);
  });

  it('should reject non-ASCII input', () => {
    const input = 'בלה בלה :)';
    expect(validator.isAscii(input)).toBe(false);
  });

  it('should sanitize input by escaping HTML entities', () => {
    const input = '<script>alert("XSS")</script>';
    const sanitized = validator.escape(input);
    expect(sanitized).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });
});

'use strict';

/**
 * Converts Base64-encoded data to string.
 *
 * @param input Base64-encoded data.
 * @return Binary-encoded data string.
 */
export function atob(input: string): string {
  return Buffer.from(input, 'base64').toString('binary');
}

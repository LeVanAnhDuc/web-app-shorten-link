import { randomInt } from 'node:crypto';

/** Base62 minus the look-alikes 0 O 1 l I — codes are read, typed and scanned (DR-2). */
export const CODE_ALPHABET =
  '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const CODE_LENGTH = 7;

/** Cryptographically random short code; uniqueness is enforced by the DB. */
export function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return code;
}

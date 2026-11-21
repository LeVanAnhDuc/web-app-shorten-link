import { CODE_ALPHABET, CODE_LENGTH, generateCode } from './code-generator';

describe('generateCode', () => {
  it('uses a 57-character alphabet without look-alike characters', () => {
    expect(CODE_ALPHABET).toHaveLength(57);
    expect(CODE_ALPHABET).not.toMatch(/[0O1lI]/);
  });

  it('always returns 7 characters from the alphabet', () => {
    for (let i = 0; i < 1000; i++) {
      const code = generateCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect(code).toMatch(/^[2-9A-HJ-NP-Za-km-z]{7}$/);
    }
  });
});

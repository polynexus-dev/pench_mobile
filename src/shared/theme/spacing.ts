// export const spacing = {
// 0: 0,
// 1: 4,
// 2: 8,
// 3: 12,
// 4: 16,
// 5: 20,
// 6: 24,
// 8: 32,
// 10: 40,
// 12: 48,
// 16: 64,
// } as const;

const { spacing: _spacing } = require("./tokens");

export const spacing = _spacing as {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  8: number;
  10: number;
  12: number;
  16: number;
};

export type SpacingKey = keyof typeof spacing;
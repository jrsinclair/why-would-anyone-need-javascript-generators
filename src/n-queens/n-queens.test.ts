import fc, { type Arbitrary } from 'fast-check';
import { type Nat, attacks, queens, natToArray, transpose, isValidSolution } from '.';

const genNat = (max: number = 998) => fc.nat({ max: Math.min(998, max) }) as Arbitrary<Nat>;

// describe('attacks', () => {
//   it('should return true whenever the queens are in the same column', () => {
//     fc.assert(
//       fc.property(genNat(), genNat(), genNat(), (x, y1, y2) => {
//         expect(attacks([x, y1], [x, y2])).toBe(true);
//       }),
//     );
//   });

//   it('should return true whenever the queens are in the same row', () => {
//     fc.assert(
//       fc.property(genNat(), genNat(), genNat(), (x1, x2, y) => {
//         expect(attacks([x1, y], [x2, y])).toBe(true);
//       }),
//     );
//   });

//   const genAttacker = fc
//     .tuple(
//       genNat(),
//       genNat(),
//       genNat(),
//       fc.integer({ max: 1, min: -1 }),
//       fc.integer({ max: 1, min: -1 }),
//     )
//     .map(([x, y, distBoundary, xDirection, yDirection]) => {
//       const offset = Math.min(Math.abs(distBoundary - x), Math.abs(distBoundary - y), x, y);
//       const x1 = (xDirection * offset + x) as Nat;
//       const y1 = (yDirection * offset + y) as Nat;
//       return [[x, y] as const, [x1, y1] as const] as const;
//     });

//   it('should return true if the queens are on the same diagonal', () => {
//     fc.assert(
//       fc.property(genAttacker, ([a, b]) => {
//         expect(attacks(a, b)).toBe(true);
//       }),
//     );
//   });

//   const genNonAttacker = fc
//     .tuple(genNat(995), genNat(995))
//     .chain(([x, y]) =>
//       fc.tuple(fc.constant(x), fc.constant(y), fc.integer({ min: 2, max: 998 - x })),
//     )
//     .map(([x, y, xOffset]) => [[x, y] as const, [x + xOffset, y + 1] as [Nat, Nat]] as const);

//   it('should always return false if the queens are not attacking', () => {
//     fc.assert(
//       fc.property(genNonAttacker, ([a, b]) => {
//         expect(attacks(a, b)).toBe(false);
//       }),
//     );
//   });
// });

const range = (n: number) => new Uint8Array(n).fill(0).map((_, i) => i);

const swap = ([i, j]: [number, number], arr: Uint8Array) => {
  const valI = arr[i];
  const valJ = arr[j];
  arr[i] = valJ;
  arr[j] = valI;
  return arr;
};

const genMatrix = fc
  .nat({ max: 255 })
  .chain((n) =>
    fc.tuple(
      fc.constant(n),
      fc.array(fc.tuple(fc.nat({ max: Math.max(n - 1, 0) }), fc.nat({ max: Math.max(n - 1, 0) }))),
    ),
  )
  .map(([n, pairs]) => {
    const arr = range(n);
    return new Uint8Array(pairs.reduce((matrix, pair) => swap(pair, matrix), arr));
  });

describe.each`
  input           | expected
  ${[0, 1, 2, 3]} | ${[0, 1, 2, 3]}
  ${[1, 2, 3, 0]} | ${[3, 0, 1, 2]}
  ${[1, 3, 0, 2]} | ${[2, 0, 3, 1]}
`(`transpose()`, ({ input, expected }) => {
  it(`should return ${JSON.stringify(expected)} when given ${JSON.stringify(input)}`, () => {
    expect(transpose(new Uint8Array(input))).toEqual(new Uint8Array(expected));
  });
});

describe('transpose()', () => {
  it('should return the same array if transpose is applied twice', () => {
    fc.assert(
      fc.property(genMatrix, (input) => {
        expect(transpose(transpose(input))).toEqual(input);
      }),
    );
  });
});

describe.each`
  n    | x    | digits
  ${1} | ${0} | ${[0]}
  ${2} | ${0} | ${[0, 0]}
  ${2} | ${1} | ${[0, 1]}
  ${2} | ${2} | ${[1, 0]}
  ${2} | ${3} | ${[1, 1]}
  ${3} | ${0} | ${[0, 0, 0]}
  ${3} | ${1} | ${[0, 0, 1]}
  ${3} | ${2} | ${[0, 0, 2]}
`('natToArray()', ({ n, x, digits }) => {
  it(`should return ${JSON.stringify(digits)} when converting ${x} to base ${n}`, () => {
    const actual = natToArray(n)(x);
    const expected = new Uint8Array(digits);
    expect(actual).toEqual(expected);
  });
});

describe.each`
  input                 | expected
  ${[0]}                | ${true}
  ${[0, 1]}             | ${false}
  ${[1, 0]}             | ${false}
  ${[0, 1, 2]}          | ${false}
  ${[1, 2, 0]}          | ${false}
  ${[2, 1, 0]}          | ${false}
  ${[1, 3, 0, 2]}       | ${true}
  ${[0, 4, 2, 5, 1, 3]} | ${false}
`('isValidSolution()', ({ input, expected }) => {
  it(`should return ${expected} when given ${JSON.stringify(input)}`, () => {
    expect(isValidSolution(new Uint8Array(input))).toBe(expected);
  });
});

const genNatsToConvert = fc
  .nat({ max: 12 })
  .map((n) => n + 1)
  .chain((n) => fc.tuple(fc.constant(n), fc.nat({ max: Math.pow(n, n) - 1 })));

describe('natToArray()', () => {
  const modelNatToArray = (n: number) => (num: number) => {
    const ret = num
      .toString(Math.max(n, 2))
      .padStart(Math.max(n, 1), '0')
      .split('')
      .map((digit) => parseInt(digit, Math.max(n, 2)));
    return new Uint8Array(ret);
  };
  it('should always produce the same result as the model', () => {
    fc.assert(
      fc.property(genNatsToConvert, ([n, x]) => {
        const actual = natToArray(n)(x);
        const expected = modelNatToArray(n)(x);
        expect(actual).toEqual(expected);
      }),
    );
  });
});

describe.each`
  n    | expected
  ${1} | ${[[0, 0]]}
  ${2} | ${[]}
  ${3} | ${[]}
  ${4} | ${[[0, 1], [1, 3], [2, 0], [3, 2]]}
  ${5} | ${[[0, 0], [1, 2], [2, 4], [3, 1], [4, 3]]}
`('queens()', ({ n, expected }) => {
  it(`should return expected result for n = ${n}`, () => {
    expect([...queens(n)]).toEqual(expected);
  });
});

describe('queens()', () => {
  it('should find a solution of length 8 for the 8-queens problem', () => {
    const actual = queens(8);
    expect(actual).toHaveLength(8);
  });
});

// describe('queens()', () => {
//   it('should always find a solution of length N', () => {
//     fc.assert(
//       fc.property(fc.nat({ max: 4 }).map((n) => n + 4) as Arbitrary<Nat>, (n: Nat) => {
//         expect(queens(n)).toHaveLength(n);
//       }),
//     );
//   });
// });

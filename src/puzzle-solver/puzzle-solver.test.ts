import fc, { Arbitrary } from 'fast-check';
import {
  type Puzzle,
  type PuzzleVal,
  type PuzzleRow,
  findRowSwaps,
  transpose,
  solve,
} from './index';

const genPuzzleVal = fc.nat({ max: 998 }).map((x) => (x === 0 ? ' ' : x)) as Arbitrary<PuzzleVal>;

const genNat998 = fc.nat({ max: 997 }).map((x) => x + 1) as Arbitrary<PuzzleVal>;

const genPuzzleRowWithSpace = fc
  .tuple(fc.uniqueArray(genNat998), fc.uniqueArray(genNat998))
  .map(([pre, post]) => pre.concat([' ']).concat(post));

const genPuzzleRowWithTwoSwaps = fc
  .tuple(fc.uniqueArray(genNat998, { minLength: 1 }), fc.uniqueArray(genNat998, { minLength: 1 }))
  .map(([pre, post]) => pre.concat([' ']).concat(post));

const genPuzzleRowWithOneSwap = fc
  .tuple(fc.uniqueArray(genNat998, { minLength: 1 }), fc.boolean())
  .map(([restOfRow, atStart]) =>
    atStart ? [' ' as PuzzleVal].concat(restOfRow) : restOfRow.concat([' ']),
  );

const genPuzzle: Arbitrary<Puzzle> = fc
  .tuple(fc.nat({ max: 9 }), fc.nat({ max: 9 }))
  .map(([c, r]) => [c + 1, r + 1])
  .chain(([cols, rows]) => {
    const spaceLocation = fc.nat({ max: Math.max(cols * rows - 1, 0) });
    const puzzleBoard = fc.array(fc.array(genNat998, { maxLength: cols, minLength: cols }), {
      maxLength: rows,
      minLength: rows,
    });
    return fc.tuple(fc.constant(cols), spaceLocation, puzzleBoard);
  })
  .map(([cols, spaceLocation, puzzleBoard]) => {
    if (puzzleBoard.length === 0 || puzzleBoard[0].length === 0) return puzzleBoard;
    const spaceRow = Math.floor(spaceLocation / cols);
    const spaceCol = spaceLocation % cols;
    const rows = puzzleBoard.length;
    if (puzzleBoard[spaceRow] === undefined || puzzleBoard[spaceRow][spaceCol] === undefined)
      console.log({ cols, rows, spaceRow, spaceCol, spaceLocation, puzzleBoard });
    puzzleBoard[spaceRow][spaceCol] = ' ' as PuzzleVal;
    return puzzleBoard;
  });

describe('findRowSwaps()', () => {
  // Given a row with less than 2 elements, should always return an empty array.
  it('should always return an empty array when given a row with less than two elements', () => {
    fc.assert(
      fc.property(fc.array(genPuzzleVal, { maxLength: 1 }), (row) => {
        expect([...findRowSwaps(row)]).toHaveLength(0);
      }),
    );
  });

  // Given a row without a space, should always return an empty array.
  it('should always return an empty array when given a row without a space', () => {
    fc.assert(
      fc.property(fc.array(genNat998), (row) => {
        expect([...findRowSwaps(row)]).toHaveLength(0);
      }),
    );
  });

  // Given a row with a single space, should never return more than two results.
  it('should never return more than two results when given a row with a single space', () => {
    fc.assert(
      fc.property(genPuzzleRowWithSpace, (row) => {
        expect([...findRowSwaps(row)].length).toBeLessThanOrEqual(2);
      }),
    );
  });

  // In each result, any spaces should be one square away from the original location of any space.
  it('should always move the space exactly one square from its original position', () => {
    fc.assert(
      fc.property(genPuzzleRowWithSpace, (row) => {
        const swaps = [...findRowSwaps(row)];
        const origIdx = row.indexOf(' ');
        swaps.forEach((swappedRow: PuzzleRow) => {
          const newIdx = swappedRow.indexOf(' ');
          expect(Math.abs(origIdx - newIdx)).toBe(1);
        });
      }),
    );
  });

  it('should always produce two results when given a row with a space surrounded by numbers', () => {
    fc.assert(
      fc.property(genPuzzleRowWithTwoSwaps, (row) => {
        expect([...findRowSwaps(row)]).toHaveLength(2);
      }),
    );
  });

  it('should always produce a single result when given a row with a space at the start or end', () => {
    fc.assert(
      fc.property(genPuzzleRowWithOneSwap, (row) => {
        expect([...findRowSwaps(row)]).toHaveLength(1);
      }),
    );
  });
});

describe('transpose()', () => {
  it('should return the same puzzle if applied twice, assuming a length of at least 1', () => {
    fc.assert(
      fc.property(genPuzzle, (puzzle) => {
        expect(transpose(transpose(puzzle))).toEqual(puzzle);
      }),
    );
  });

  // After transposing once, elements of the first column should be the elements of the original
  // first row.
  it('should return an array where the elements of the first column are the elements of the original first row', () => {
    fc.assert(
      fc.property(genPuzzle, (puzzle) => {
        const result = transpose(puzzle);
        puzzle.forEach((origRow, i) => {
          const newCol = result.map((row) => row[i]);
          expect(newCol).toEqual(origRow);
        });
      }),
    );
  });
});

describe('solve()', () => {
  it('should return a result', () => {
    const start: Puzzle = [
      [1, 2, 3],
      [4, 5, 6],
      [' ', 7, 8],
    ];
    const goal: Puzzle = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, ' '],
    ];
    const result = solve(start, goal);
    expect(result).not.toBeNull();
  });
});

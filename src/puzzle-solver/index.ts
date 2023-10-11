type NatRange<Arr extends number[] = []> = Arr['length'] extends 999
  ? Arr[number]
  : NatRange<[...Arr, Arr['length']]>;
export type Nat = NatRange;

export type PuzzleVal = ' ' | Exclude<Nat, 0>;

export type PuzzleRow = ReadonlyArray<PuzzleVal>;

export type Puzzle = ReadonlyArray<PuzzleRow>;

function* empty() {}

function* concat<T>(as: Iterable<T>, bs: Iterable<T>): Generator<T> {
  for (let a of as) yield a;
  for (let b of bs) yield b;
}

const map = function* <A, B>(transform: (a: A) => B, iterable: Iterable<A>): Generator<B> {
  for (let item of iterable) {
    yield transform(item);
  }
};

function* unit<A>(a: A): Generator<A> {
  yield a;
}

const filter = function* <A>(shouldKeep: (a: A) => boolean, items: Iterable<A>) {
  for (let item of items) {
    if (shouldKeep(item)) yield item;
  }
};

const pop = <A>(as: Generator<A, void>): [A | void, Generator<A, void>] => {
  const { value }: IteratorResult<A, void> = as.next();
  return [value, as];
};

const arrayAppend =
  <A>(as: ReadonlyArray<A>) =>
  (a: A): ReadonlyArray<A> => [a, ...as];

export const findRowSwaps = (row: PuzzleRow): Generator<PuzzleRow> => {
  if (row.length < 2) return empty();
  if (row.indexOf(' ') === -1) return empty();
  const [a, b, ...rest] = row;
  const firstSwap = a === ' ' || b === ' ' ? unit([b, a, ...rest] as PuzzleRow) : empty();
  const otherSwaps = map(
    (swappedRow: PuzzleRow): PuzzleRow => [a, ...swappedRow],
    findRowSwaps([b, ...rest]),
  );
  return concat(firstSwap, otherSwaps);
};

export const transpose = (puzzle: Puzzle): Puzzle =>
  (puzzle[0] ?? []).map((_, colIndex) => puzzle.map((row) => row[colIndex]));

const findAllRowSwaps = (puzzle: Puzzle): Generator<Puzzle> => {
  if (puzzle.length === 0) return empty();
  const [row, ...rest] = puzzle;
  return concat<Puzzle>(
    map((r) => [r, ...rest], findRowSwaps(row)),
    map((otherRows) => [row].concat(otherRows), findAllRowSwaps(rest)),
  );
};

const neighbours = (puzzle: Puzzle): Generator<Puzzle> => {
  const pt = transpose(puzzle);
  const rowSwaps = findAllRowSwaps(puzzle);
  const colSwaps = map(transpose, findAllRowSwaps(pt));
  return concat(rowSwaps, colSwaps);
};

const reverseArray = <A>(as: ReadonlyArray<A>): ReadonlyArray<A> => as.slice(0).reverse();

const eq = (a: Puzzle, b: Puzzle) => a.every((aRow, r) => aRow.every((val, c) => val === b[r][c]));

export const solve = (start: Puzzle, goal: Puzzle): ReadonlyArray<Puzzle> | null => {
  const helper = () => {
    let queue: Generator<ReadonlyArray<Puzzle>> = unit([start]);
    let visited = new Set<string>([JSON.stringify(start)]);
    let [currentPath, q] = pop(queue);
    while (currentPath) {
      let p = currentPath[0];
      if (eq(p, goal)) return currentPath;
      let next = () => filter((b: Puzzle) => !visited.has(JSON.stringify(b)), neighbours(p));
      queue = concat(q, map(arrayAppend(currentPath), next()));
      visited.add(JSON.stringify(p));
      [currentPath, q] = pop(queue);
    }
    return null;
  };

  const result = helper();
  return result === null ? null : reverseArray(result);
};

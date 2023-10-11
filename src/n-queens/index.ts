import { pipe } from 'fp-ts/function';
export type Nat = number;

type Solution = ReadonlyArray<readonly [Nat, Nat]>;

export function attacks([x1, y1]: readonly [Nat, Nat], [x2, y2]: readonly [Nat, Nat]): boolean {
  return x1 == x2 || y1 == y2 || Math.abs(x1 - x2) == Math.abs(y1 - y2);
}

function* natRange(min: Nat, max: Nat): Generator<Nat> {
  let i = min;
  while (i <= max) {
    yield i;
    i += 1;
  }
}

const filter = <A>(shouldKeep: (a: A) => boolean) =>
  function* (items: Iterable<A>) {
    for (let item of items) {
      if (shouldKeep(item)) yield item;
    }
  };

const map = <A, B>(transform: (a: A) => B) =>
  function* (iterable: Iterable<A>): Generator<B> {
    for (let item of iterable) {
      yield transform(item);
    }
  };

const head = <A>(as: Generator<A>): A | undefined => as.next().value;

export const natToArray = (n: number) => (x: number) =>
  Uint8Array.from({ length: n }).map((_, i) =>
    Math.floor((x % Math.pow(n, n - i)) / Math.pow(n, n - i - 1)),
  );

function* naturalNumbers() {
  let i = 0; // The n means this is a BigInt
  while (true) {
    yield i;
    i += 1;
  }
}

const takeWhile = <A>(shouldYield: (x: A) => boolean) =>
  function* (iterable: Iterable<A>) {
    for (let item of iterable) {
      if (!shouldYield(item)) return;
      yield item;
    }
  };

const first = <A>(shouldYield: (x: A) => boolean) =>
  function* (iterable: Iterable<A>) {
    for (let item of iterable) {
      if (shouldYield(item)) {
        yield item;
        return;
      }
    }
  };

// const solutionArrays = (n: number) => map(natToArray(n), natRange(0, Math.pow(n, n)));

export const transpose = (solution: Uint8Array) => solution.map((_, i) => solution.indexOf(i));

const noRepeats = (solution: Uint8Array) => new Set(solution).size === solution.length;

const solutionToPoints = (solution: Uint8Array): [number, number][] =>
  [...solution].map((y, x) => [x, y]);

const attacksDiagonal = (y1: number, x1: number, arr: Uint8Array) =>
  arr.some((y2, x2) => Math.abs(x1 - x2) == Math.abs(y1 - y2) && x1 !== x2 && y1 !== y2);

export const isValidSolution = (solution: Uint8Array): boolean =>
  noRepeats(solution) && !solution.some(attacksDiagonal);

const headOrElse =
  <A>(fallback: A) =>
  (as: IterableIterator<A>) =>
    as.next().value || fallback;

export const queens = (n: number): Solution =>
  pipe(
    naturalNumbers(),
    takeWhile((x) => x < n ** n),
    map(natToArray(n)),
    filter(isValidSolution),
    headOrElse(Uint8Array.from([])),
    solutionToPoints,
  );

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

const filter = function* <A>(shouldKeep: (a: A) => boolean, items: Iterable<A>) {
  for (let item of items) {
    if (shouldKeep(item)) yield item;
  }
};

const map = function* <A, B>(transform: (a: A) => B, iterable: Iterable<A>): Generator<B> {
  for (let item of iterable) {
    yield transform(item);
  }
};

const head = <A>(as: Generator<A>): A | undefined => as.next().value;

export const natToArray = (n: number) => (x: number) => {
  return new Uint8Array(n)
    .fill(0)
    .map((_, i) => Math.floor((x % Math.pow(n, n - i)) / Math.pow(n, n - i - 1)));
};

const solutionArrays = (n: number) => map(natToArray(n), natRange(0, Math.pow(n, n)));

// export const transpose = (solution: Uint8Array) => {
//   const result = new Uint8Array(solution.length);
//   solution.forEach((j, i) => {
//     result[j] = i;
//   });
//   return result;
// };
export const transpose = (solution: Uint8Array) => solution.map((_, i) => solution.indexOf(i));

const noRepeats = (solution: Uint8Array) => new Set(solution).size === solution.length;

const solutionToPoints = (solution: Uint8Array): [number, number][] =>
  [...solution].map((x, y) => [x, y]);

export const diffs = (arr: Uint8Array): Int8Array => {
  const tail = arr.slice(1);
  return tail.reduce((ret, val, i) => {
    ret[i] = val - arr[i];
    return ret;
  }, new Int8Array(tail.length));
};

const attacksDiagonal = (y1: number, x1: number, arr: Uint8Array) =>
  arr.some((y2, x2) => Math.abs(x1 - x2) == Math.abs(y1 - y2) && x1 !== x2 && y1 !== y2);

export const isValidSolution = (solution: Uint8Array): boolean =>
  noRepeats(solution) && noRepeats(transpose(solution)) && !solution.some(attacksDiagonal);

export const queens = (n: number): Solution =>
  pipe(
    solutionArrays(n),
    (solutions) => filter(isValidSolution, solutions),
    (solutions) => head(solutions) ?? [],
    solutionToPoints,
  );

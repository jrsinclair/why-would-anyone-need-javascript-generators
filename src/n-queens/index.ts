import { pipe } from 'fp-ts/function';
import { zip } from 'fp-ts/lib/Array';
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

export const natToArray = (n: number) => (x: number) => {
  const radix = Math.max(n, 2);
  return Uint8Array.from(
    x
      .toString(radix)
      .padStart(n, '0')
      .split('')
      .map((i) => parseInt(i, radix)),
  );
};

// export const natToArray = (n: number) => (x: number) =>
//   Uint8Array.from({ length: n }).map((_, i) =>
//     Math.floor((x % Math.pow(n, n - i)) / Math.pow(n, n - i - 1)),
//   );

function* naturalNumbers() {
  let i = 0;
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

export const takeUntil = <A>(shouldStop: (x: A) => boolean) => {
  return function* (iterable: Iterable<A>) {
    for (let item of iterable) {
      if (shouldStop(item)) {
        yield item;
        return;
      }
      yield item;
    }
  };
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

export const transpose = (solution: Uint8Array) => solution.map((_, i) => solution.indexOf(i));

const noRepeats = (solution: Uint8Array) => new Set(solution).size === solution.length;

const solutionToPoints = (solution: Uint8Array): [number, number][] =>
  [...solution].map((y, x) => [x, y]);

const attacksDiagonal = (y1: number, x1: number, arr: Uint8Array) =>
  arr.some((y2, x2) => Math.abs(x1 - x2) == Math.abs(y1 - y2) && x1 !== x2 && y1 !== y2);

export const isValidSolution = (solution: Uint8Array): boolean =>
  noRepeats(solution) && !solution.some(attacksDiagonal);

const take = (maxResults: number) =>
  function* <A>(iterable: Iterable<A>) {
    let count = 0;
    for (const item of iterable) {
      if (count >= maxResults) return;
      yield item;
      count += 1;
    }
  };

const headOrElse =
  <A>(fallback: A) =>
  (as: IterableIterator<A>) =>
    as.next().value || fallback;

export const queens = (n: number): Solution =>
  pipe(
    naturalNumbers(),
    take(n ** n),
    map(natToArray(n)),
    filter(isValidSolution),
    headOrElse(Uint8Array.from([])),
    solutionToPoints,
  );

// Animate queens
// ------------------------------------------------------------------------------------------------

const mapAdjacent = <A, B>(transform: (x: A, y: A) => B) =>
  function* (xs: IterableIterator<A>) {
    let { value: prev, done } = xs.next();
    if (done) return;
    for (let x of xs) {
      yield transform(prev, x);
      prev = x;
    }
  };

const chain = <A, B>(f: (a: A) => Iterable<B>) =>
  function* (xs: Iterable<A>) {
    for (const x of xs) yield* f(x);
  };

export const flatMap = chain;

export function* join<A>(xs: Iterable<Iterable<A>>) {
  for (const x of xs) {
    yield* x;
  }
}

type AddQueenToBoard = {
  id: string;
  x: number;
  action: 'add-queen-to-board';
};

type MoveQueen = {
  id: string;
  action: 'move-queen';
  to: [number, number];
};

type Action = AddQueenToBoard | MoveQueen;

const placeQueensActions = (n: number): Generator<AddQueenToBoard> =>
  pipe(
    naturalNumbers(),
    takeWhile((x) => x < n),
    map((x) => ({ id: `queen-${x}`, x, action: 'add-queen-to-board' })),
  );

function* concat<A>(as: Iterable<A>, bs: Iterable<A>) {
  for (const a of as) yield a;
  for (const b of bs) yield b;
}

export const moveQueen = (from: Uint8Array, to: Uint8Array): Iterable<MoveQueen> => {
  const positions = zip(Array.from(from), Array.from(to)).map((pair, x) => [...pair, x]);
  return pipe(
    positions,
    flatMap(([y1, y2, x]) =>
      y1 !== y2 ? [{ id: `queen-${x}`, action: 'move-queen', to: [x, y2] }] : [],
    ),
  );
};

const tap =
  <A>(effect: (a: A) => void) =>
  (a: A) => {
    effect(a);
    return a;
  };

const solveQueensActions = (n: number) =>
  pipe(
    naturalNumbers(),
    takeWhile((x) => x < n ** n),
    map(natToArray(n)),
    takeUntil(isValidSolution),
    mapAdjacent(moveQueen),
    join,
  );

function memo<A, B>(f: (a: A) => B) {
  const memoCache = new Map();
  return (x: A): B => {
    if (!memoCache.has(x)) memoCache.set(x, f(x));
    return memoCache.get(x);
  };
}

const forEach = <A>(f: (x: A) => unknown) =>
  function (xs: Iterable<A>) {
    for (const x of xs) f(x);
  };

export const animateQueenActions = (n: number): Generator<Action> => {
  return concat<Action>(placeQueensActions(n), solveQueensActions(n));
};

const animateMoveQueen = ({ id, to: [x, y] }: MoveQueen) => {
  const queen = getById(id);
  if (!queen) return;
  const idx = getById(`idx-${x}`);
  queen.className = queen.className.replace(/\s*Piece--\d\d\b/g, '').concat(` Piece--${x}${y}`);
  idx && (idx.innerHTML = `${y}`);
};

const getById = memo((id) => document.querySelector(`#${id}`));

const animateAddQueen = ({ id, x }: AddQueenToBoard) => {
  let queen = getById(id);
  if (!queen) {
    queen = document.createElement('li');
    queen.classList.add('Piece', `Piece--${x}0`);
    const pieces = document.querySelector(`.ChessBoard-pieces`);
    if (pieces) {
      pieces.appendChild(queen);
    }
  }
  // animateMoveQueen({ id, to: [x, 0], action: 'move-queen' });
};

const animationMap = (action: Action) => {
  switch (action.action) {
    case 'add-queen-to-board':
      return () => animateAddQueen(action);
    case 'move-queen':
      return () => animateMoveQueen(action);
  }
};

const delay =
  (time: number) =>
  <A>(val: A) =>
    new Promise<A>((resolve) => {
      setTimeout(() => resolve(val), time);
    });

const reduce =
  <A, B>(reducer: (b: B, a: A) => B, init: B) =>
  (as: Iterable<A>) => {
    let acc = init;
    for (let a of as) {
      acc = reducer(acc, a);
    }
    return acc;
  };

// export const animateQueens = (actions: Iterable<Action>) =>
//   pipe(
//     actions,
//     reduce(async (prev, action) => {
//       await prev;
//       await delay(100)(undefined);
//       const actionToTake = animationMap(action);
//       actionToTake();
//     }, Promise.resolve()),
//   );
export const animateQueens = async (actions: Iterable<Action>) => {
  for await (let action of map(delay(1000 / 8))(actions)) {
    animationMap(action)();
  }
};

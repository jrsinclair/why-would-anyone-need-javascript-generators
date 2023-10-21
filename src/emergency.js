function* myGeneratorFunction() {
  // We create some data
  const claim01 = 'Efficient code';
  console.log('Created some data. Yielding', claim01);
  yield claim01;

  // And another bit of data
  const claim02 = 'Impossible code';
  console.log('Created some data. Yielding', claim02);
  yield claim02;

  // The line below might not do what you think it does.
  return 42;
}

function runGenerator(generator) {
  let result;
  do {
    result = generator.next();
    console.log(result);
  } while (!result.done);
}

function* places() {
  yield 'World';
  yield 'Web Directions';
  yield 'Sydney';
}

const map = (transform) =>
  function* (iterable) {
    for (let item of iterable) {
      yield transform(item);
    }
  };

const take = (maxResults) =>
  function* (iterable) {
    if (maxResults === 0) return;
    let count = 0;
    for (let item of iterable) {
      if (count >= maxResults) return;
      yield item;
      count += 1;
    }
  };

const pipe = (startValue, ...functions) => functions.reduce((val, f) => f(val), startValue);

function* naturalNumbers() {
  let i = 0;
  while (true) {
    yield i;
    i += 1;
  }
}

const filter = (shouldKeep) =>
  function* (iterable) {
    for (let item of iterable) {
      if (shouldKeep(item)) yield item;
    }
  };

const isEven = (x) => x % 2 === 0;

const natToArray = (n) => (x) => {
  const radix = Math.max(n, 2);
  return x
    .toString(radix)
    .padStart(n, '0')
    .split('')
    .map((i) => parseInt(i, radix));
};

const noRepeats = (solution) => new Set(solution).size === solution.length;

// Check diagonals for single queen
// Note the position of x1 and y1
const attacksDiagonal = (y1, x1, solution) =>
  solution.some((y2, x2) => Math.abs(x1 - x2) == Math.abs(y1 - y2) && x1 !== x2 && y1 !== y2);

const isValidSolution = (solution) => noRepeats(solution) && !solution.some(attacksDiagonal);

const solutionToPoints = (solution) => solution.map((y, x) => [x, y]);

const head = (iterableIterator) => iterableIterator.next().value;

// prettier-ignore
const queens = (n) =>
    pipe(
        naturalNumbers(),
        map(natToArray(n)),
        filter(isValidSolution),
        map(solutionToPoints),
        head,
    );

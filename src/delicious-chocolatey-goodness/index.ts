const defaultAnimationList: BiscuitAnimation[] = [];

// Utilities
// ------------------------------------------------------------------------------------------------

const $$: typeof document.querySelectorAll = document.querySelectorAll.bind(document);
const $: typeof document.querySelector = document.querySelector.bind(document);

const last = <A>(items: A[]) => items[items.length - 1];

const uniq = <A>(as: ReadonlyArray<A>) => [...new Set(as).values()];

export const take = (maxResults: number) =>
  function* <A>(iterable: Iterable<A>) {
    if (maxResults === 0) return;
    let count = 0;
    for (let item of iterable) {
      yield item;
      count += 1;
      if (count >= maxResults) return;
    }
  };

const biscuitsInMug = (animationList: BiscuitAnimation[]) =>
  animationList.reduce((idsInMug, { id, action }) => {
    if (action === 'insert-into-mug') idsInMug.add(id);
    if (action === 'consume') idsInMug.delete(id);
    return idsInMug;
  }, new Set<string>()).size;

// Types and Classes
// ------------------------------------------------------------------------------------------------
class Biscuit {
  readonly id: string;
  readonly animationList: BiscuitAnimation[];

  constructor(id: string, animationList?: BiscuitAnimation[]) {
    this.animationList = animationList ?? defaultAnimationList;
    this.id = id;
  }
}

export class PristineBiscuit extends Biscuit {}

export class BittenBiscuit extends Biscuit {}

export class TwiceBittenBiscuit extends Biscuit {}

export class StrawPosition extends Biscuit {}

export class FlavourExplosion extends Biscuit {}

export class Consumed extends Biscuit {}

export class Fail extends Biscuit {}

// TS won't exhaustively check sub-classes, so we create our own union type. And we want to exclude
// the base type anyway.
export type TimTam =
  | PristineBiscuit
  | BittenBiscuit
  | TwiceBittenBiscuit
  | StrawPosition
  | FlavourExplosion
  | Consumed
  | Fail;

export type AnimationAction =
  | 'new-biscuit'
  | 'bite-arbitrary-corner'
  | 'bite-opposite-corner'
  | 'insert-into-mug'
  | 'draw-liquid'
  | 'consume'
  | 'fail';

export type BiscuitAnimation = Readonly<{
  id: string;
  action: AnimationAction;
}>;

// Biscuit transforms
// ------------------------------------------------------------------------------------------------

export function biteArbitraryCorner({ id, animationList }: PristineBiscuit): BittenBiscuit {
  animationList.push({ id, action: 'bite-arbitrary-corner' });
  return new BittenBiscuit(id, animationList);
}

export function biteOppositeCorner({ id, animationList }: BittenBiscuit): TwiceBittenBiscuit {
  animationList.push({ id, action: 'bite-opposite-corner' });
  return new TwiceBittenBiscuit(id, animationList);
}

export function insertIntoBeverage({ id, animationList }: TwiceBittenBiscuit): StrawPosition {
  animationList.push({ id, action: 'insert-into-mug' });
  return new StrawPosition(id, animationList);
}

export function drawLiquid({ id, animationList }: StrawPosition): FlavourExplosion | Fail {
  if (biscuitsInMug(animationList) > 1) {
    if (last(animationList)?.action !== 'fail') {
      animationList.push({ id, action: 'draw-liquid' });
      animationList.push({ id, action: 'fail' });
    }
    return new Fail(id, animationList);
  }
  animationList.push({ id, action: 'draw-liquid' });
  return new FlavourExplosion(id, animationList);
}

export function insertIntoMouth({ id, animationList }: FlavourExplosion): Consumed {
  animationList.push({ id, action: 'consume' });
  return new Consumed(id, animationList);
}

// Animations
// ------------------------------------------------------------------------------------------------

export const getBiscuit = (id: string, list: BiscuitAnimation[] = defaultAnimationList) => {
  list.push({ id, action: 'new-biscuit' });
  return new PristineBiscuit(id, list);
};

function createWrapper() {
  const wrapper = document.createElement('ul');
  wrapper.classList.add('biscuits');
  document.body.appendChild(wrapper);
  return wrapper;
}

function createBiscuit(id: string) {
  const biscuit = document.createElement('li');
  biscuit.innerHTML = 'Tim Tam';
  biscuit.classList.add('biscuit');
  biscuit.id = id;
  biscuit.setAttribute('data-testid', id);
  document.body.appendChild(biscuit);
  return biscuit;
}

function newBiscuit(id: string) {
  const wrapper: HTMLElement = document.querySelector('.biscuits') ?? createWrapper();
  const biscuit = createBiscuit(id);
  wrapper.appendChild(biscuit);
  return biscuit;
}

function animateBiteArbitraryCorner(id: string) {
  const biscuit = $(`#${id}`) ?? newBiscuit(id);
  if (!biscuit) newBiscuit(id);
  biscuit.classList.add('once-bitten');
  biscuit.innerHTML = 'Bitten biscuit';
  const head = $('.smile, .top-of-head');
  head?.classList.add('waiting');
  head && (head.innerHTML = '🙂');
  return biscuit;
}

function animateBiteOppositeCorner(id: string) {
  const biscuit = $(`#${id}`) ?? createBiscuit(id);
  biscuit.classList.add('twice-bitten');
  biscuit.classList.remove('once-bitten');
  biscuit.innerHTML = 'Twice bitten biscuit';
  return biscuit;
}

function createMug() {
  const mug = document.createElement('div');
  mug.innerHTML = 'Mug';
  mug.classList.add('mug');
  document.body.appendChild(mug);
  const mugAfter = document.createElement('div');
  mugAfter.classList.add('mug-after');
  document.body.appendChild(mugAfter);
  return mug;
}

function animateInsertIntoMug(id: string) {
  $('.mug') || createMug();
  const biscuit = $(`#${id}`) ?? createBiscuit(id);
  biscuit.classList.add('in-mug');
  biscuit.classList.remove('twice-bitten', 'once-bitten');
  biscuit.innerHTML = 'Biscuit with corner in mug';
  return biscuit;
}

function createTopOfHead() {
  const topOfHead = document.createElement('div');
  topOfHead.innerHTML = 'Person';
  topOfHead.classList.add('person', 'top-of-head');
  document.body.appendChild(topOfHead);
  return topOfHead;
}

function animateDrawLiquid() {
  const head = $('.person') ?? createTopOfHead();
  head.classList.add('top-of-head');
  head.classList.remove('smile', 'waiting');
}

function animateConsume(id: string) {
  const person = $('.person') ?? createTopOfHead();
  person.classList.add('smile');
  person.classList.remove('top-of-head');
  person.innerHTML = '😋';
  const biscuit = $(`#${id}`);
  biscuit && biscuit.parentElement?.removeChild(biscuit);
  return biscuit;
}

const createProblem = () => {
  const problem = document.createElement('div');
  problem.classList.add('problem');
  problem.innerHTML = '💩';
  document.body.appendChild(problem);
};

function animateFail() {
  $$('.biscuit').forEach((biscuit) => biscuit.parentElement?.removeChild(biscuit));
  $('.problem') ?? createProblem();
  const person = $('.person') ?? createTopOfHead();
  person.classList.remove('top-of-head', 'smile');
  person.classList.add('sad');
  return;
}

interface AnimationOptions {
  cadence: number;
}

function delay<A>(period: number, value: A): Promise<A> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), period);
  });
}

export async function runAnimation(
  actions: ReadonlyArray<BiscuitAnimation>,
  { cadence }: AnimationOptions = { cadence: 1000 },
) {
  return actions.reduce(
    (promise, { id, action }) =>
      promise.then(() => {
        const wait = action === 'new-biscuit' ? cadence / 10 : cadence;
        if (action === 'new-biscuit') {
          newBiscuit(id);
        }
        if (action === 'bite-arbitrary-corner') {
          animateBiteArbitraryCorner(id);
        }
        if (action === 'bite-opposite-corner') {
          animateBiteOppositeCorner(id);
        }
        if (action === 'insert-into-mug') {
          animateInsertIntoMug(id);
        }
        if (action === 'draw-liquid') {
          animateDrawLiquid();
        }
        if (action === 'consume') {
          animateConsume(id);
        }
        if (action === 'fail') {
          animateFail();
        }
        return delay(wait, undefined);
      }),
    Promise.resolve(),
  );
}

export async function animate(biscuits: ReadonlyArray<Biscuit>, opts: AnimationOptions) {
  const lists = biscuits.map((b) => b.animationList);
  const animationList = uniq(lists).flat();
  return runAnimation(animationList, opts);
}

const defaultAnimationList: BiscuitAnimation[] = [];

class Biscuit {
  readonly id: string;
  readonly animationList: BiscuitAnimation[];

  constructor(id: string, animationList?: BiscuitAnimation[]) {
    this.animationList = animationList ?? defaultAnimationList;
    this.id = id;
  }
}

class PristineBiscuit extends Biscuit {}

class BittenBiscuit extends Biscuit {}

class TwiceBittenBiscuit extends Biscuit {}

class StrawPosition extends Biscuit {}

class FlavourExplosion extends Biscuit {}

class Consumed extends Biscuit {}

// TS won't exhaustively check sub-classes, so we create our own union type. And we want to exclude
// the base type anyway.
export type TimTam =
  | PristineBiscuit
  | BittenBiscuit
  | TwiceBittenBiscuit
  | StrawPosition
  | FlavourExplosion
  | Consumed;

export type AnimationAction =
  | 'new-biscuit'
  | 'bite-arbitrary-corner'
  | 'bite-opposite-corner'
  | 'insert-into-mug'
  | 'draw-liquid'
  | 'consume';

export type BiscuitAnimation = Readonly<{
  id: string;
  action: AnimationAction;
}>;

export function biteArbitraryCorner({ id, animationList }: PristineBiscuit): BittenBiscuit {
  animationList.push({ id, action: 'bite-arbitrary-corner' });
  return new BittenBiscuit(id, animationList);
}

export function biteOppositeCorner({ id, animationList }: BittenBiscuit): TwiceBittenBiscuit {
  animationList.push({ id, action: 'bite-opposite-corner' });
  return new TwiceBittenBiscuit(id, animationList);
}

export function insertIntoMug({ id, animationList }: TwiceBittenBiscuit): StrawPosition {
  animationList.push({ id, action: 'insert-into-mug' });
  return new StrawPosition(id, animationList);
}

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
  topOfHead.classList.add('top-of-head');
  document.body.appendChild(topOfHead);
  return topOfHead;
}

function createSmile() {
  const smile = document.createElement('div');
  smile.classList.add('smile');
  smile.innerHTML = '😋';
  document.body.appendChild(smile);
  return smile;
}

function animateConsume(id: string) {
  $('.smile') || createSmile();
  $('.top-of-head')?.classList.add('hidden');
  const biscuit = $(`#${id}`);
  biscuit && biscuit?.parentElement?.removeChild(biscuit);
  return biscuit;
}

interface AnimationOptions {
  cadence: number;
}

function delay<A>(period: number, value: A): Promise<A> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), period);
  });
}

const $: typeof document.querySelector = document.querySelector.bind(document);

export async function animate(
  actions: ReadonlyArray<BiscuitAnimation>,
  { cadence }: AnimationOptions = { cadence: 1000 },
) {
  return actions.reduce(
    (promise, { id, action }) =>
      promise.then(() => {
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
          $('.top-of-head') || createTopOfHead();
        }
        if (action === 'consume') {
          animateConsume(id);
        }
        return delay(cadence, undefined);
      }),
    Promise.resolve(),
  );
}

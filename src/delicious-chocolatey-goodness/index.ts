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
  const bikky = createBiscuit(id);
  wrapper.appendChild(bikky);
  return bikky;
}

function animateBiteArbitraryCorner(id: string) {
  const biscuit: HTMLElement = ($(`#${id}`) as HTMLElement | null) ?? newBiscuit(id);
  if (!biscuit) newBiscuit(id);
  biscuit.classList.add('once-bitten');
  biscuit.innerHTML = 'Bitten biscuit';
  return biscuit;
}

function createMug() {
  const mug = document.createElement('ul');
  mug.innerHTML = 'Mug';
  mug.classList.add('mug');
  document.body.appendChild(mug);
  return mug;
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
        if (action === 'insert-into-mug') {
          $('.mug') || createMug();
        }
        return delay(cadence, undefined);
      }),
    Promise.resolve(),
  );
}

const defaultAnimationList: Animation[] = [];

class Biscuit {
  readonly id: string;
  readonly animationList: Animation[];

  constructor(id: string, animationList?: Animation[]) {
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

type AnimationAction =
  | 'new-biscuit'
  | 'bite-arbitrary-corner'
  | 'bite-opposite-corner'
  | 'insert-into-mug'
  | 'draw-liquid'
  | 'consume';

type Animation = Readonly<{
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
  const wrapper = document.createElement('div');
  wrapper.classList.add('biscuits');
  document.body.appendChild(wrapper);
  return wrapper;
}

function createBiscuit(id) {
  const biscuit = document.createElement('div');
  biscuit.classList.add('biscuit');
  biscuit.id = id;
  biscuit.setAttribute('data-testid', id);
  document.body.appendChild(biscuit);
  return biscuit;
}

function newBiscuit(id: string) {
  const wrapper = document.querySelector('.biscuits') ?? createWrapper();
  wrapper.appendChild(createBiscuit(id));
}

export function animate(actions: ReadonlyArray<Animation>) {
  actions.forEach(({ id, action }) => {
    if (action === 'new-biscuit') {
      newBiscuit(id);
    }
  });
}

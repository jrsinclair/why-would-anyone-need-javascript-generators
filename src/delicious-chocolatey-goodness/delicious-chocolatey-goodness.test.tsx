/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import fc from 'fast-check';
import { screen } from '@testing-library/dom';
import {
  type AnimationAction,
  type BiscuitAnimation,
  runAnimation,
  getBiscuit,
  biteArbitraryCorner,
  biteOppositeCorner,
  drawLiquid,
  insertIntoBeverage,
  Fail,
  StrawPosition,
  take,
} from './index';
import fs from 'node:fs';
import { pipe } from 'fp-ts/lib/function';

const resetDOM = () => {
  document.body.innerHTML = '';
};

const addStylesheet = () => {
  const styles = fs.readFileSync(__dirname + '/index.css').toString('utf-8');
  const stylesheet = document.createElement('style');
  stylesheet.innerHTML = styles;
  stylesheet.setAttribute('type', 'text/css');
  document.head.appendChild(stylesheet);
};

// const hasOverlap = (els: ReadonlyArray<HTMLElement>) =>
//   els.some((el) => {
//     const others = els.filter((other) => other !== el);
//     const { ax, y: ay, width: awidth, height: aheight } = el.getBoundingClientRect();
//     return others.some((other) => {
//       const { x: bx, y: by, width: bwidth, height: bheight } = el.getBoundingClientRect();
//       console.log({
//         ax: el.offsetLeft,
//         bx: other.offsetLeft,
//         ay: el.offsetTop,
//         by: other.offsetTop,
//         awidth: el.offsetWidth,
//         bwidth: other.offsetWidth,
//         aheight: el.offsetHeight,
//         bheight: other.offsetHeight,
//       });
//       return !(bx + bwidth < ax || bx > ax + awidth || by + bheight < ay || by > ax + aheight);
//     });
//   });

const genIdString = fc.stringMatching(/^[a-aA-Z_][\w\-]*$/);

const genAction = (id: string, allowedActions: ReadonlyArray<AnimationAction>) =>
  fc.constantFrom(...allowedActions).map((action) => ({ id, action }));

const genBiscuits = (
  allowedActions: ReadonlyArray<AnimationAction>,
  arrayOpts?: fc.ArrayConstraints,
) =>
  fc
    .uniqueArray(genIdString, arrayOpts)
    .chain((ids) => fc.tuple(...ids.map((id) => genAction(id, allowedActions))));

const bikkySequence = (id: string, size: 1 | 2 | 3 | 4 | 5 | 6): ReadonlyArray<BiscuitAnimation> =>
  (
    [
      'new-biscuit',
      'bite-arbitrary-corner',
      'bite-opposite-corner',
      'insert-into-mug',
      'draw-liquid',
      'consume',
    ] as const
  )
    .slice(0, size)
    .map((action) => ({ id, action }));

const oneToFour = [1, 2, 3, 4] as const;
const oneToFive = [1, 2, 3, 4, 5] as const;

const genBikkySequenceToMug = (arrayOpts?: fc.ArrayConstraints) =>
  fc
    .uniqueArray(genIdString, arrayOpts)
    .chain((ids) =>
      fc.tuple(...ids.map((id) => fc.tuple(fc.constant(id), fc.constantFrom(...oneToFour)))),
    )
    .map((pairs) => pairs.flatMap(([id, size]) => bikkySequence(id, size)));

const genBikkySequenceToDrawLiquid = (arrayOpts?: fc.ArrayConstraints) =>
  fc
    .uniqueArray(genIdString, arrayOpts)
    .chain((ids) =>
      fc.tuple(...ids.map((id) => fc.tuple(fc.constant(id), fc.constantFrom(...oneToFive)))),
    )
    .map((pairs) => pairs.flatMap(([id, size]) => bikkySequence(id, size)));

describe('animate()', () => {
  beforeAll(addStylesheet);

  afterEach(resetDOM);

  // Rendering a biscuit should add an element with class biscuit to the DOM
  it('when given a new-biscuit action, should add an element with class biscuit to the DOM', async () => {
    const action = { id: 'biscuit-01', action: 'new-biscuit' } as const;
    await runAnimation([action], { cadence: 0 });
    expect(screen.getByTestId(action.id)).toBeInTheDocument();
  });

  it('when given an array of new-biscuit actions, animating the actions should result in the same number of .biscuit elements being in the DOM', async () => {
    return fc.assert(
      fc
        .asyncProperty(genBiscuits(['new-biscuit'], { maxLength: 11 }), async (actions) => {
          await runAnimation(actions, { cadence: 0 });
          expect(screen.queryAllByText('Tim Tam', { selector: '.biscuit' })).toHaveLength(
            actions.length,
          );
        })
        .afterEach(resetDOM),
    );
  });

  // Rendering multiple pristine, bitten, or twice-bitten biscuits should not result in overlap
  // it('when given at least two pristine, bitten, or twice-bitten biscuits, the biscuits should not overlap', async () => {
  //   return fc.assert(
  //     fc
  //       .asyncProperty(genBikkySequence(), async (actions) => {
  //         await animate(actions, { cadence: 0 });
  //         expect(hasOverlap(screen.queryAllByText('Tim Tam', { selector: '.biscuit' }))).toBe(
  //           false,
  //         );
  //       })
  //       .afterEach(resetDOM),
  //     { numRuns: 1000 },
  //   );
  // });

  it('should render an element with class once-bitten when animating bite-arbitrary-corner', async () => {
    const genActions = genIdString.map((id) => [
      { id, action: 'new-biscuit' } as const,
      { id, action: 'bite-arbitrary-corner' } as const,
    ]);
    return fc.assert(
      fc
        .asyncProperty(genActions, async (actions) => {
          await runAnimation(actions, { cadence: 0 });
          expect(
            screen.queryAllByText('Bitten biscuit', { selector: '.once-bitten' }),
          ).toHaveLength(1);
        })
        .afterEach(resetDOM),
    );
  });

  it('should render an element with class twice-bitten when animating bite-opposite-corner', () => {
    const genActions = genIdString.map((id) => [
      { id, action: 'new-biscuit' } as const,
      { id, action: 'bite-arbitrary-corner' } as const,
      { id, action: 'bite-opposite-corner' } as const,
    ]);
    return fc.assert(
      fc
        .asyncProperty(genActions, async (actions) => {
          await runAnimation(actions, { cadence: 0 });
          expect(
            screen.queryAllByText('Twice bitten biscuit', { selector: '.twice-bitten' }),
          ).toHaveLength(1);
        })
        .afterEach(resetDOM),
    );
  });

  // Rendering a straw position biscuit should result in an element with class mug being in the DOM
  it('should render a mug element when there is an insert-into-mug action', async () => {
    const actions: BiscuitAnimation[] = [
      { id: 'biscuit-01', action: 'new-biscuit' },
      { id: 'biscuit-01', action: 'bite-arbitrary-corner' },
      { id: 'biscuit-01', action: 'bite-opposite-corner' },
      { id: 'biscuit-01', action: 'insert-into-mug' },
    ];
    await runAnimation(actions, { cadence: 0 });
    expect(screen.queryAllByText('Mug', { selector: '.mug' })).toHaveLength(1);
    expect(
      screen.queryAllByText('Biscuit with corner in mug', { selector: '.in-mug' }),
    ).toHaveLength(1);
  });

  // There should only ever be one mug element
  it('should only ever render a single mug element', async () => {
    return fc.assert(
      fc.asyncProperty(genBikkySequenceToMug(), async (actions) => {
        await runAnimation(actions, { cadence: 0 });
        expect(screen.queryAllByText('Mug', { selector: '.mug' }).length).toBeLessThanOrEqual(1);
      }),
    );
  });

  // Rendering a flavour explosion biscuit should result in an element with class top-of-head being in the DOM
  it('should render a top-of-head element when there is a draw-liquid action', async () => {
    const actions: BiscuitAnimation[] = [
      { id: 'biscuit-01', action: 'new-biscuit' },
      { id: 'biscuit-01', action: 'bite-arbitrary-corner' },
      { id: 'biscuit-01', action: 'bite-opposite-corner' },
      { id: 'biscuit-01', action: 'insert-into-mug' },
      { id: 'biscuit-01', action: 'draw-liquid' },
    ];
    await runAnimation(actions, { cadence: 0 });
    expect(screen.queryAllByText('Person', { selector: '.top-of-head' })).toHaveLength(1);
    expect(
      screen.queryAllByText('Biscuit with corner in mug', { selector: '.in-mug' }),
    ).toHaveLength(1);
  });

  // There should only ever be one top-of-head element
  it('should only ever render a single top-of-head element', async () => {
    return fc.assert(
      fc.asyncProperty(genBikkySequenceToDrawLiquid(), async (actions) => {
        await runAnimation(actions, { cadence: 0 });
        expect(screen.queryAllByText('Person', { selector: '.head' }).length).toBeLessThanOrEqual(
          1,
        );
      }),
    );
  });

  // A consumed biscuit should not be visible, but should result in a smiley face being visible if
  // there are no flavour-explosion biscuits rendered.
  it('should hide consumed biscuits and show a smiley face', async () => {
    const actions: BiscuitAnimation[] = [
      { id: 'biscuit-01', action: 'new-biscuit' },
      { id: 'biscuit-01', action: 'bite-arbitrary-corner' },
      { id: 'biscuit-01', action: 'bite-opposite-corner' },
      { id: 'biscuit-01', action: 'insert-into-mug' },
      { id: 'biscuit-01', action: 'draw-liquid' },
      { id: 'biscuit-01', action: 'consume' },
    ];
    await runAnimation(actions, { cadence: 0 });
    expect(screen.queryByText('Person', { selector: '.top-of-head' })).not.toBeInTheDocument();
    expect(screen.queryByText('Person', { selector: '.smile' })).not.toBeInTheDocument();
    expect(screen.queryByText(/biscuit/i)).not.toBeInTheDocument();
    expect(screen.queryByText('😋', { selector: '.smile' })).toBeVisible();
  });

  // The top of all visible biscuits should always be higher than the top of the mug

  // Pristine, bitten, or twice-bitten biscuits should never overlap a head or face

  // Attempting to render more than one flavour explosion biscuit should result in an error state
  it('should render an error state if we attempt to render draw-liquid action and there is more than one biscuit in the mug', async () => {
    const list = [];
    const biscuit01 = pipe(
      getBiscuit('biscuit-01', list),
      biteArbitraryCorner,
      biteOppositeCorner,
      insertIntoBeverage,
    );
    const biscuit02 = pipe(
      getBiscuit('biscuit-02', list),
      biteArbitraryCorner,
      biteOppositeCorner,
      insertIntoBeverage,
      drawLiquid,
    );
    expect(biscuit01).toBeInstanceOf(StrawPosition);
    expect(biscuit02).toBeInstanceOf(Fail);
    const lastAnimation = biscuit02.animationList[biscuit02.animationList.length - 1];
    expect(lastAnimation.action).toBe('fail');
  });

  it('should show a sad person and a poop emoji with no biscuits when rendering a fail', async () => {
    const actions: BiscuitAnimation[] = [
      { id: 'biscuit-01', action: 'new-biscuit' },
      { id: 'biscuit-01', action: 'bite-arbitrary-corner' },
      { id: 'biscuit-01', action: 'bite-opposite-corner' },
      { id: 'biscuit-01', action: 'insert-into-mug' },
      { id: 'biscuit-01', action: 'draw-liquid' },
      { id: 'biscuit-01', action: 'fail' },
    ];
    await runAnimation(actions, { cadence: 0 });
    expect(screen.queryByText('Person', { selector: '.top-of-head' })).not.toBeInTheDocument();
    expect(screen.queryByText('Person', { selector: '.smile' })).not.toBeInTheDocument();
    expect(screen.queryByText(/biscuit/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Person', { selector: '.sad' })).toBeVisible();
  });

  it('should stop adding to the animation list if there is already a fail', async () => {
    const list: BiscuitAnimation[] = [];
    const biscuits = [getBiscuit('b01', list), getBiscuit('b02', list)]
      .map(biteArbitraryCorner)
      .map(biteOppositeCorner)
      .map(insertIntoBeverage)
      .map(drawLiquid);
    const lastAnimation = biscuits[0].animationList[biscuits[0].animationList.length - 1];
    expect(lastAnimation.action).toBe('fail');
    expect(list.filter(({ action }) => action === 'draw-liquid')).toHaveLength(1);
    expect(list.filter(({ action }) => action === 'fail')).toHaveLength(1);
  });

  // Attempting to render a flavour explosion biscuit and consumed biscuit should be the same as if
  // there was no consumed biscuit

  // When rendering a bite animation, or insert-into-mug, any head should be in waiting mode.
  it('should set any head element to waiting mode when rendering a bite animation or insert-into-mug', async () => {
    return fc.assert(
      fc.asyncProperty(genBikkySequenceToMug({ minLength: 1 }), async (actions) => {
        actions.splice(
          1,
          0,
          { id: actions[0]?.id, action: 'consume' },
          { id: actions[0]?.id, action: 'bite-arbitrary-corner' },
        );
        await runAnimation(actions, { cadence: 0 });
        expect(screen.queryByText('🙂', { selector: '.waiting' })).toBeVisible();
      }),
    );
  });
});

describe('take()', () => {
  it('should return the expected result', () => {
    expect(Array.from(take(0)(['a', 'b', 'c']))).toEqual([]);
  });
  it('should return minimum of requested items or array length', () => {
    fc.assert(
      fc.property(fc.array(fc.string()), fc.nat(), (strs, n) => {
        expect(Array.from(take(n)(strs))).toHaveLength(Math.min(n, strs.length));
      }),
    );
  });
});

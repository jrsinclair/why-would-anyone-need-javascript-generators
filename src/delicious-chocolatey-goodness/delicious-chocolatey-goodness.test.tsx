/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import fc from 'fast-check';
import { screen } from '@testing-library/dom';
import { type AnimationAction, type BiscuitAnimation, animate } from './index';

const resetDOM = () => {
  document.body.innerHTML = '';
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

const oneTwoThree = [1, 2, 3] as const;
const oneToFour = [1, 2, 3, 4] as const;
const oneToFive = [1, 2, 3, 4, 5] as const;

const genBikkySequence = () =>
  fc
    .uniqueArray(genIdString, { minLength: 2 })
    .chain((ids) =>
      fc.tuple(...ids.map((id) => fc.tuple(fc.constant(id), fc.constantFrom(...oneTwoThree)))),
    )
    .map((pairs) => pairs.flatMap(([id, size]) => bikkySequence(id, size)));

const genBikkySequenceToMug = (arrayOpts?: fc.ArrayConstraints) =>
  fc
    .uniqueArray(genIdString, arrayOpts)
    .chain((ids) =>
      fc.tuple(...ids.map((id) => fc.tuple(fc.constant(id), fc.constantFrom(...oneToFour)))),
    )
    .map((pairs) => pairs.flatMap(([id, size]) => bikkySequence(id, size)));

describe('animate()', () => {
  afterEach(resetDOM);

  // Rendering a biscuit should add an element with class biscuit to the DOM
  it('when given a new-biscuit action, should add an element with class biscuit to the DOM', async () => {
    const action = { id: 'biscuit-01', action: 'new-biscuit' } as const;
    await animate([action], { cadence: 0 });
    expect(screen.getByTestId(action.id)).toBeInTheDocument();
  });

  it('when given an array of new-biscuit actions, animating the actions should result in the same number of .biscuit elements being in the DOM', async () => {
    return fc.assert(
      fc
        .asyncProperty(genBiscuits(['new-biscuit'], { maxLength: 11 }), async (actions) => {
          await animate(actions, { cadence: 0 });
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
          await animate(actions, { cadence: 0 });
          expect(
            screen.queryAllByText('Bitten biscuit', { selector: '.once-bitten' }),
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
    await animate(actions, { cadence: 0 });
    expect(screen.queryAllByText('Mug', { selector: '.mug' })).toHaveLength(1);
  });

  // There should only ever be one mug element
  it('should only ever render a single mug element', async () => {
    return fc.assert(
      fc.asyncProperty(genBikkySequenceToMug(), async (actions) => {
        await animate(actions, { cadence: 0 });
        expect(screen.queryAllByText('Mug', { selector: '.mug' }).length).toBeLessThanOrEqual(1);
      }),
    );
  });

  // Rendering a flavour explosion biscuit should result in an element with class top-of-head being in the DOM

  // There should only ever be one top-of-head element

  // A consumed biscuit should not be visible, but should result in a smiley face being visible if
  // there are no flavour-explosion biscuits rendered.

  // The top of all visible biscuits should always be higher than the top of the mug

  // Pristine, bitten, or twice-bitten biscuits should never overlap a head or face

  // Attempting to render more than one flavour explosion biscuit should result in an error state

  // Attempting to render a flavour explosion biscuit and consumed biscuit should be the same as if
  // there was no consumed biscuit
});

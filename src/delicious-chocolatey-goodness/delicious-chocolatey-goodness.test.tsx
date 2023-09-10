/**
 * @jest-environment jsdom
 */
import { screen } from '@testing-library/dom';
import { animate } from './index';

// Rendering a biscuit should add an element with class timtam to the DOM
describe('animate()', () => {
  it('when given a new-biscuit action, should add an element with class timatam to the DOM', () => {
    const action = { id: 'biscuit-01', action: 'new-biscuit' } as const;
    animate([action]);
    expect(screen.getByTestId(action.id)).toBeVisible();
  });
});

// Rendering multiple pristine, bitten, or twice-bitten biscuits should not result in overlap

// Rendering a straw position biscuit should result in an element with class mug being in the DOM

// There should only ever be one mug element

// Rendering a flavour explosion biscuit should result in an element with class top-of-head being in the DOM

// There should only ever be one top-of-head element

// A consumed biscuit should not be visible, but should result in a smiley face being visible if
// there are no flavour-explosion biscuits rendered.

// The top of all visible biscuits should always be higher than the top of the mug

// Pristine, bitten, or twice-bitten biscuits should never overlap a head or face

// Attempting to render more than one flavour explosion biscuit should result in an error state

// Attempting to render a flavour explosion biscuit and consumed biscuit should be the same as if
// there was no consumed biscuit

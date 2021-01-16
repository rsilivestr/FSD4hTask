/* eslint-disable no-undef */
import { use, expect } from 'chai';
import { Handler, HandlerOptions } from '../src/Components/interfaces';
import RSHandler from '../src/Components/RSHandler';

use(require('chai-dom'));

describe('RSHandler', () => {
  const o: HandlerOptions = {
    id: 0,
    layout: 'horizontal',
    tooltip: true,
    value: 5,
  };

  const h: Handler = new RSHandler(o);

  describe('getElement', () => {
    const result = h.getElement();

    it('Should retun an HTMLElement', () => {
      expect(result).to.have.class('rslider__handler');
    });
  });

  describe('setPosition', () => {
    // const result = h.setPosition(0);
  });

  describe('toggleTooltip', () => {
    it('Should turn tooltip on', () => {
      expect(h.toggleTooltip(true)).to.equal(true);
      expect(h.getElement()).to.have.descendant('.rslider__tooltip');
    });

    // it('Should hide tooltip as well', () => {
    //   expect(h.toggleTooltip(false)).to.equal(false);
    //   expect(h.getElement()).not.to.have.descendant('.rslider__tooltip');
    // });
  });
});

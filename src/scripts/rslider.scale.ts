// eslint-disable-next-line no-unused-vars
import { Observer } from './interfaces';
// eslint-disable-next-line no-unused-vars
import { Model } from './rslider.model';
// eslint-disable-next-line no-unused-vars
import { View } from './rslider.view';

export interface Scale extends Observer {
  model: Model;
  view: View;
  container: HTMLElement;
  scaleMarks: HTMLElement[];
  markValues: number[];

  update(): void;
}

export default class RScale implements Scale {
  model: Model;

  view: View;

  container: HTMLElement;

  scale: HTMLElement = document.createElement('ul');

  scaleMarks: HTMLElement[] = [];

  markValues: number[] = [];

  constructor(model: Model, view: View, container: HTMLElement) {
    this.model = model;
    model.addObserver(this);
    this.view = view;
    this.container = container;
  }

  private populateScale(scale: HTMLElement) {
    this.scale.textContent = '';
    this.scaleMarks = [];
    this.markValues = [];

    const { minValue, maxValue, stepSize } = this.model.getOptions();

    for (let i = minValue; i < maxValue + stepSize; i += stepSize) {
      // when last step is smaller (scale length isn't multiple of step size)
      if (i > maxValue) i = maxValue;

      const mark = document.createElement('li');
      mark.className = 'rslider-scale__mark';
      mark.innerText = i.toString(10);
      scale.appendChild(mark);

      this.scaleMarks.push(mark);
      this.markValues.push(i);
    }
  }

  // used by RSlider
  public render() {
    const { isHorizontal } = this.view.getOptions();
    const layout = isHorizontal ? 'horizontal' : 'vertical';
    this.scale.className = `rslider-scale rslider-scale--layout_${layout}`;

    this.populateScale(this.scale);

    this.scale.addEventListener('click', (e) => {
      this.scaleMarks.forEach((el, index) => {
        if (e.target === el) {
          const val = this.markValues[index];
          this.model.updateValue(0, val);
        }
      });
    });

    this.container.appendChild(this.scale);
  }

  update() {
    if (this.model.getOptions().changed) this.populateScale(this.scale);
  }
}
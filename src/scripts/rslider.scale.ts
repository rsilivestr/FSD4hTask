import { Observer } from './interfaces';
import { Model } from './rslider.model';
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

  scaleStep: number;

  // 10 steps = 11 marks
  maxScaleSteps: number = 10;

  constructor(model: Model, view: View, container: HTMLElement) {
    this.model = model;
    model.addObserver(this);
    this.view = view;
    this.container = container;
  }

  private _calcScaleStep(): number {
    const { minValue, maxValue, stepSize } = this.model.getOptions();
    const stepNumber: number = (maxValue - minValue) / stepSize;

    if (stepNumber > this.maxScaleSteps) {
      // More steps than scale can hold
      return stepSize * Math.ceil(stepNumber / this.maxScaleSteps);
    }

    return stepSize;
  }

  private _populateScale(scale: HTMLElement): HTMLElement {
    this.scale.textContent = '';
    this.scaleMarks = [];
    this.markValues = [];

    const { minValue, maxValue } = this.model.getOptions();
    const scaleLength: number = Math.abs(maxValue - minValue);
    const scaleStepSize: number = this._calcScaleStep();
    const stepNumber: number = Math.abs(scaleLength / scaleStepSize);

    let i = 0;
    let value = minValue;

    while (i <= stepNumber) {
      const mark = document.createElement('li');
      mark.className = 'rslider-scale__mark';
      mark.innerText = value.toString(10);
      scale.appendChild(mark);

      this.scaleMarks.push(mark);
      this.markValues.push(value);

      value += scaleStepSize;
      i += 1;
    }
    return this.scale;
  }

  // used by RSlider
  public render() {
    const { isHorizontal } = this.view.getOptions();
    const layout = isHorizontal ? 'horizontal' : 'vertical';
    this.scale.className = `rslider-scale rslider-scale--layout_${layout}`;

    this._populateScale(this.scale);

    this.scale.addEventListener('click', (e) => {
      this.scaleMarks.forEach((el, index) => {
        if (e.target === el) {
          // jump to value on click
          const val = this.markValues[index];
          this.model.updateValue(0, val);
        }
      });
    });

    this.container.appendChild(this.scale);

    return this.scale;
  }

  public update() {
    const { changed } = this.model.getOptions();

    if (changed) {
      // Re-render scale if model options were changed
      this._populateScale(this.scale);
    }
  }
}

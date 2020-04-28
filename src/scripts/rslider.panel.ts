// eslint-disable-next-line no-unused-vars
import { Observer } from './interfaces';
// eslint-disable-next-line no-unused-vars
import { Model, ModelOptions } from './rslider.model';
// eslint-disable-next-line no-unused-vars
import { View, ViewOptions } from './rslider.view';

export interface Panel extends Observer {
  model: Model;
  modelOptions: ModelOptions;
  view: View;
  viewOptions: ViewOptions;
  container: HTMLElement;
  values: number[];
  handlerInputs: HTMLInputElement[];

  createInput(parent: HTMLElement, labelText: string): HTMLElement;
  setHandlerValue(e: KeyboardEvent, index: number): void;
  setModelOption(e: KeyboardEvent, key: keyof ModelOptions): ModelOptions;
  render(): HTMLElement;
  update(): number[];
}

export default class RSPanel implements Panel {
  model: Model;

  modelOptions: ModelOptions;

  view: View;

  viewOptions: ViewOptions;

  container: HTMLElement;

  values: number[];

  handlerInputs: HTMLInputElement[] = [];

  constructor(model: Model, view: View, container: HTMLElement) {
    this.model = model;
    model.addObserver(this);
    this.modelOptions = this.model.getOptions();

    this.view = view;
    this.viewOptions = view.getOptions();

    this.container = container;

    this.values = this.model.handlerValues.slice();
  }

  // eslint-disable-next-line class-methods-use-this
  createInput(parent: HTMLElement, labelText: string) {
    const label = document.createElement('label');
    label.className = 'rslider-panel__label';
    label.innerText = labelText;
    parent.appendChild(label);

    const input = document.createElement('input');
    input.className = 'rslider-panel__input';
    // input.type = 'number';
    label.appendChild(input);

    return input;
  }

  setHandlerValue(e: KeyboardEvent, index: number) {
    if (e.key === 'Enter') {
      const input: HTMLInputElement = <HTMLInputElement>e.target;
      const inputValue = input.value;

      const re = /^-?\d+$/;
      const valid = re.test(inputValue);

      if (valid) {
        this.model.updateValue(index, +inputValue);
      }
    }
  }

  setModelOption(e: KeyboardEvent, key: keyof ModelOptions) {
    if (e.key === 'Enter') {
      const input: HTMLInputElement = <HTMLInputElement>e.target;
      const options: ModelOptions = {};
      const value: number = +input.value;

      if (key === 'stepSize') {
        options[key] = Math.abs(value);
      } else if (key !== 'range') {
        options[key] = value;
      }

      this.model.setOptions(options);
    }
    return this.modelOptions;
  }

  render() {
    const panel: HTMLElement = document.createElement('div');
    panel.className = 'rslider-panel';

    const { handlerCount } = this.model.options;

    for (let i = 0; i < handlerCount; i += 1) {
      const name = `Handler #${i + 1}`;
      const input = this.createInput(panel, name);

      input.value = this.values[i].toString(10);

      input.addEventListener('keyup', (e) => { this.setHandlerValue(e, i); });

      this.handlerInputs.push(input);
    }

    const minInput = this.createInput(panel, 'Min value');
    minInput.value = this.modelOptions.minValue.toString(10);
    minInput.addEventListener('keydown', (e) => { this.setModelOption(e, 'minValue'); });

    const maxInput = this.createInput(panel, 'Max value');
    maxInput.value = this.modelOptions.maxValue.toString(10);
    maxInput.addEventListener('keydown', (e) => { this.setModelOption(e, 'maxValue'); });

    const stepInput = this.createInput(panel, 'Step size');
    stepInput.value = this.modelOptions.stepSize.toString(10);
    stepInput.addEventListener('keydown', (e) => { this.setModelOption(e, 'stepSize'); });

    const tooltipInput = this.createInput(panel, 'Tooltip');
    tooltipInput.type = 'checkbox';
    tooltipInput.checked = this.viewOptions.showTooltip;
    tooltipInput.addEventListener('change', () => { this.view.setTooltip(tooltipInput.checked); });

    this.container.appendChild(panel);

    return panel;
  }

  update() {
    this.values = this.model.handlerValues;
    this.handlerInputs.forEach((input, index) => {
      // eslint-disable-next-line no-param-reassign
      input.value = this.values[index].toString(10);
    });
    return this.values;
  }
}

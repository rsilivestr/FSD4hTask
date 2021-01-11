import SliderOptions from './interface/SliderOptions';
import Panel from './interface/Panel';
import RSubject from './subject';
import Slider from './interface/Slider';

export default class RSPanel extends RSubject implements Panel {
  public slider: Slider;

  private options: SliderOptions;

  private UI: {
    container: HTMLElement;
    inputs: HTMLInputElement[];
    panel: HTMLElement;
  } = {
    container: null,
    inputs: [],
    panel: null,
  };

  constructor(s: Slider) {
    super();

    this._init(s);
  }

  public notifyObservers: (index: number, value: number) => void = (index, value) => {
    this.observers.forEach((o) => o(index, value));
  };

  public update(v: number[]): number[] {
    // Update inputs
    this.UI.inputs.forEach((input, index) => {
      input.value = v[index].toString();
    });

    return v;
  }

  private _init(s: Slider) {
    this.slider = s;
    this.UI.container = s.el;
    this.options = s.getConfig();
    // Create and append panel
    this._render();
    // Subscribe to model updates
    s.addModelObserver(this.update.bind(this));
    s.notifyModelObservers();
    // Subscribe presenter to panel updates
    this.addObserver(s.value.bind(s));
  }

  private _createInput(labelText: string, isCheckbox: boolean = false): HTMLInputElement {
    const label = document.createElement('label');
    label.className = 'rslider-panel__label';
    label.textContent = labelText;
    this.UI.panel.appendChild(label);

    const input = document.createElement('input');
    input.className = 'rslider-panel__input';
    if (isCheckbox) {
      input.type = 'checkbox';
    }
    label.appendChild(input);

    return input;
  }

  private _render() {
    // Create panel element
    this.UI.panel = document.createElement('div');
    this.UI.panel.className = 'rslider-panel';

    const { handlerCount } = this.options;

    // Render handler value inputs
    for (let i = 0; i < handlerCount; i += 1) {
      const name = `Handler #${i + 1}`;
      const input = this._createInput(name);

      input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          const value = parseInt(input.value, 10);

          this.notifyObservers(i, value);
        }
      });

      this.UI.inputs.push(input);
    }

    // Create min input
    const minInput = this._createInput('minValue');
    minInput.value = this.options.minValue.toString(10);
    minInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const minValue = parseInt(minInput.value, 10);

        this.slider.setConfig({ minValue });
      }
    });

    // Create max input
    const maxInput = this._createInput('maxValue');
    maxInput.value = this.options.maxValue.toString(10);
    maxInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const maxValue = parseInt(maxInput.value, 10);

        this.slider.setConfig({ maxValue });
      }
    });

    // Create step input
    const stepInput = this._createInput('stepSize');
    stepInput.value = this.options.stepSize.toString(10);
    stepInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const stepSize = parseInt(stepInput.value, 10);

        this.slider.setConfig({ stepSize });
      }
    });

    // Create isHorizontal checkbox
    const isHorizontalInput = this._createInput('isHorizontal', true);
    isHorizontalInput.checked = this.options.isHorizontal;
    isHorizontalInput.addEventListener('change', () => {
      this.slider.setConfig({ isHorizontal: isHorizontalInput.checked });
    });

    // Create tooltip checkbox
    const tooltipInput = this._createInput('tooltip', true);
    tooltipInput.checked = this.options.isHorizontal;
    tooltipInput.addEventListener('change', () => {
      this.slider.setConfig({ tooltip: tooltipInput.checked });
    });

    // Create progress checkbox
    const progressInput = this._createInput('progress', true);
    progressInput.checked = this.options.isHorizontal;
    progressInput.addEventListener('change', () => {
      this.slider.setConfig({ progress: progressInput.checked });
    });

    // Append to container
    this.UI.container.appendChild(this.UI.panel);
  }
}

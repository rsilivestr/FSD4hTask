import Handler from './interface/Handler';
import HandlerOptions from './interface/HandlerOptions';
import ModelOptions from './interface/ModelOptions';
import SliderOptions from './interface/SliderOptions';
import View from './interface/View';
import ViewOptions from './interface/ViewOptions';

import RSHandler from './handler';
import RScale from './scale';
import RSubject from './subject';

type ViewElements = {
  progress?: HTMLElement;
  scale?: HTMLElement;
  slider?: HTMLElement;
  track?: HTMLElement;
};

export default class RSView extends RSubject implements View {
  private container: HTMLElement;

  private grabbed: HTMLElement = null;

  private handlers: Handler[] = [];

  private modelOptions: ModelOptions;

  private options: ViewOptions = {};

  private scale: RScale;

  private UI: ViewElements = {};

  private values: number[] = [];

  constructor(el: HTMLElement, o: SliderOptions = {}) {
    super();
    // Save root element
    this.container = el;
    // Set options
    this._configure(o);
  }

  public notifyObservers: (index: number, value: number) => void = (index, value) => {
    this.observers.forEach((o) => o(index, value));
  };

  public render() {
    if (this.container == null) {
      throw new Error('There is no element matching provided selector.');
    }

    // Create & append slider element
    this.UI.slider = this._elCreateSlider();

    // Create & append track element
    this.UI.track = this._elCreateTrack();

    // Create & append handler elements
    this._createHandlers();

    // Create & append progress element
    if (this.options.progress) {
      this.UI.progress = this._elCreateProgress();
    }

    return this.UI.slider;
  }

  public setValues(values: number[]): void {
    this.values = values;
  }

  public getConfig() {
    return this.options;
  }

  public setConfig(o: ViewOptions) {
    return this._configure(o);
  }

  public setModelOptions(o: ModelOptions) {
    return (this.modelOptions = o);
  }

  public addScale(o: ModelOptions) {
    const scale = new RScale(this.container, o);

    // Save to this
    this.scale = scale;

    const scaleElement = scale.getElement();

    // Append to slider and save to UI object
    this.UI.scale = scaleElement;
    this.UI.slider.insertAdjacentElement('beforeend', scaleElement);

    return scale;
  }

  public update() {
    // Re-render handlers in case handlerCound changed
    this._createHandlers();
    // Move handlers
    this._updateHandlers();
    // Update progress
    if (this.options.progress) {
      this._updateProgress();
    }

    return this.values;
  }

  private _createHandlers() {
    // Remove old handlers
    if (this.handlers.length > 0) {
      this.handlers.forEach((h) => h.getElement().remove());

      this.handlers = [];
    }

    // Add new handlers
    const { handlerCount } = this.modelOptions;

    for (let i = 0; i < handlerCount; i += 1) {
      const handler = this._addHandler(i);
      this.handlers[i] = handler;
    }
  }

  private _getRect() {
    const rect = this.UI.track.getBoundingClientRect();

    const { isHorizontal } = this.options;

    return {
      sliderLength: isHorizontal ? rect.right - rect.left : rect.bottom - rect.top,
      minCoord: isHorizontal ? rect.left : rect.bottom,
      maxCoord: isHorizontal ? rect.right : rect.top,
    };
  }

  private _correctHandlerCoord(): number {
    // Get track length
    const { sliderLength } = this._getRect();
    const r = this.options.handlerRadius;

    return 1 - (2 * r) / sliderLength;
  }

  private _coordToValue(coord: number): number {
    const { minValue, maxValue } = this.modelOptions;
    // const factor = this._correctHandlerCoord() * 100;

    return minValue + (maxValue - minValue) * (coord / 100);
  }

  private _valueToCoord(value: number): number {
    const { minValue, maxValue } = this.modelOptions;

    return ((value - minValue) / (maxValue - minValue)) * 100;
  }

  private _elCreateSlider(): HTMLElement {
    const layout = this.options.isHorizontal ? 'horizontal' : 'vertical';
    // Create element
    const slider = document.createElement('div');
    slider.className = `rslider rslider--layout_${layout}`;
    // Append
    this.container.appendChild(slider);
    // Prevent dragstart
    slider.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });

    return slider;
  }

  private _elCreateTrack(): HTMLElement {
    // Create element
    const track = document.createElement('div');
    track.className = 'rslider__track';
    // Append
    this.UI.slider.appendChild(track);

    // Add mousedown listener
    track.addEventListener('mousedown', this._onTrackClick.bind(this));

    return track;
  }

  private _updateProgress(): void {
    // For single handler
    const coordOne = this._valueToCoord(this.values[0]);
    let min = 0;
    let max = 100 - coordOne;

    if (this.modelOptions.handlerCount === 2) {
      const coordTwo = this._valueToCoord(this.values[1]);
      [min, max] = [coordOne, coordTwo];
      max = 100 - max;
    }

    if (this.options.isHorizontal) {
      this.UI.progress.style.left = `${min.toString()}%`;
      this.UI.progress.style.right = `${max.toString()}%`;
    } else {
      this.UI.progress.style.bottom = `${min.toString()}%`;
      this.UI.progress.style.top = `${max.toString()}%`;
    }
  }

  private _elCreateProgress(): HTMLElement {
    // Create element
    const progress = document.createElement('div');
    progress.className = 'rslider__progress';
    // Append
    this.UI.track.appendChild(progress);

    return progress;
  }

  private _toggleProgress(progress: boolean): void {
    // If slider is not rendered yet
    if (this.UI.slider === undefined) {
      return;
    }

    // If slider has more than 2 handlers
    if (this.modelOptions.handlerCount > 2) {
      // Set to false and return
      this.options.progress = false;
      return;
    }

    if (progress && !this.UI.progress) {
      // Create and append
      this.UI.progress = this._elCreateProgress();
      this._updateProgress();
    } else if (!progress && this.UI.progress) {
      // Remove from DOM and this.UI
      this.UI.progress.remove();
      this.UI.progress = null;
    }
  }

  private _addHandler(index: number) {
    // Initialize options
    const options: HandlerOptions = {
      id: index,
      layout: this.options.isHorizontal ? 'horizontal' : 'vertical',
      tooltip: this.options.tooltip,
      value: 0,
    };
    // Create handler instance
    const handler: Handler = new RSHandler(options);
    // Append to slider
    const handlerElement = handler.getElement();
    this.UI.slider.appendChild(handlerElement);
    // Add event listener
    handlerElement.addEventListener('mousedown', (e) => {
      this._grab(handlerElement);
      // Prevent text selection
      e.preventDefault();
    });

    return handler;
  }

  private _grab(handler: HTMLElement): void {
    // Set grabbed handler
    this.grabbed = handler;
    // Add listeners
    document.body.addEventListener('mousemove', this._boundDrag);
    document.body.addEventListener('mouseup', this._boundRelease);
  }

  private _updateHandlers() {
    this.handlers.forEach((handler, index) => {
      const value = this.values[index];
      const coord = this._valueToCoord(value) * this._correctHandlerCoord();
      // Update handler position and value
      handler.setPosition(coord);
      handler.updateValue(value);
    });
  }

  private _getRelativeCoord(e: MouseEvent): number {
    const { isHorizontal } = this.options;
    const { minCoord, sliderLength } = this._getRect();

    const diff = isHorizontal ? e.clientX - minCoord : minCoord - e.clientY;
    const coord = (diff / sliderLength) * 100;

    return coord;
  }

  private _getClosestHandlerIndex(goal: number): number {
    const closest = this.values.reduce((prev, curr) =>
      Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
    );

    const index = this.values.indexOf(closest);

    return index;
  }

  private _onTrackClick(e: MouseEvent): void {
    // Get click coord, convert to value
    const coord = this._getRelativeCoord(e);
    const value = this._coordToValue(coord);

    // Get closest handler
    const closestIndex = this._getClosestHandlerIndex(value);
    const handler = this.handlers[closestIndex].getElement();

    // Grab that handler
    this._grab(handler);

    // Update handler
    this._moveHander(coord);
  }

  private _moveHander(coord: number) {
    // Convert coord to value
    const value = this._coordToValue(coord);

    // Update model through presenter
    const index = parseInt(this.grabbed.dataset.id, 10);
    this.notifyObservers(index, value);

    // Update handlers
    this._updateHandlers();

    // Update progress bar
    if (this.options.progress) {
      this._updateProgress();
    }
  }

  private _drag(e: MouseEvent): void {
    // Get relative coord in px
    const coord = this._getRelativeCoord(e);

    this._moveHander(coord);
  }

  // Bind _drag method to this
  private _boundDrag: (e: MouseEvent) => void = this._drag.bind(this);

  private _release(): void {
    // Unset grabbed handler
    this.grabbed = null;
    // Remove listeners
    document.body.removeEventListener('mousemove', this._boundDrag);
    document.body.removeEventListener('mouseup', this._boundRelease);
  }

  // Bind _release method to this
  private _boundRelease: () => void = this._release.bind(this);

  private _updateOrientation(horizontal = true) {
    // Return if slider is not rendered yet
    if (!this.UI.slider) return;

    // Toggle classes
    if (horizontal) {
      this.UI.slider.classList.remove('rslider--layout_vertical');
      this.UI.slider.classList.add('rslider--layout_horizontal');
    } else {
      this.UI.slider.classList.add('rslider--layout_vertical');
      this.UI.slider.classList.remove('rslider--layout_horizontal');
    }

    // Update progress
    if (this.UI.progress) {
      this.UI.progress.removeAttribute('style');
      this._updateProgress();
    }

    // Update scale
    if (this.UI.scale) {
      const layout = horizontal ? 'horizontal' : 'vertical';
      this.scale.toggleLayout(layout);
    }

    // Update handlers
    const layout = horizontal ? 'horizontal' : 'vertical';
    this.handlers.forEach((h) => h.toggleLayout(layout));
  }

  private _configure(o: ViewOptions) {
    const { isHorizontal, handlerRadius, tooltip, progress } = o;

    // isHorizontal (orientation)
    if (typeof isHorizontal === 'boolean') {
      // Set value
      this.options.isHorizontal = isHorizontal;
    } else if (this.options.isHorizontal === undefined) {
      // Default value
      this.options.isHorizontal = true;
    }

    this._updateOrientation(this.options.isHorizontal);

    // Handler radius
    if (typeof handlerRadius === 'number' && !isNaN(handlerRadius)) {
      // Set value
      this.options.handlerRadius = handlerRadius;
    } else if (this.options.handlerRadius === undefined) {
      // Default value
      this.options.handlerRadius = 8;
    }

    // Tooltip
    if (typeof tooltip === 'boolean') {
      // Set value
      this.options.tooltip = tooltip;
    } else if (this.options.tooltip === undefined) {
      // Default value
      this.options.tooltip = true;
    }

    // Update handlers
    this.handlers.forEach((h) => h.toggleTooltip(this.options.tooltip));

    // Progress
    if (typeof progress === 'boolean') {
      // Set value
      this.options.progress = progress;
    } else if (this.options.progress === undefined) {
      // Default value
      this.options.progress = false;
    }

    this._toggleProgress(this.options.progress);

    return this.options;
  }
}
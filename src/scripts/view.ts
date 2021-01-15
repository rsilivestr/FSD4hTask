import Handler from './interface/Handler';
import HandlerOptions from './interface/HandlerOptions';
import ModelOptions from './interface/ModelOptions';
import SliderOptions from './interface/SliderOptions';
import View from './interface/View';
import ViewOptions from './interface/ViewOptions';

import RSHandler from './handler';
import RScale from './scale';
import RSubject from './subject';
import Progress, { IProgress, ProgressCoords } from './progress';

type ViewElements = {
  activeHandler: HTMLElement;
  progress?: HTMLElement;
  scale?: HTMLElement;
  slider?: HTMLElement;
  track?: HTMLElement;
};

type ViewChildren = {
  handlers: Handler[];
  progress: IProgress;
  scale: RScale;
  // track: Track;
};

export default class RSView extends RSubject implements View {
  private children: ViewChildren = {
    handlers: [],
    progress: null,
    scale: null,
    // track: null,
  };

  private container: HTMLElement;

  private modelOptions: ModelOptions;

  private options: ViewOptions = {};

  // UI elements
  private UI: ViewElements = {
    activeHandler: null,
    progress: null,
    scale: null,
    slider: null,
    track: null,
  };

  // Current values
  private values: number[] = [];

  constructor(container: HTMLElement, o: SliderOptions = {}) {
    super();

    // Save root element
    this.container = container;

    this._init(o);
  }

  public setValues(values: number[]): void {
    if (this._areArraysEqual(values, this.values)) return;

    this.values = values;

    if (this.children.scale) {
      this.children.scale.setValues(values);
    }

    this.update();
  }

  public getConfig() {
    return this.options;
  }

  public setConfig(o: ViewOptions) {
    return this._configure(o);
  }

  public setModelOptions(o: SliderOptions) {
    const { minValue, maxValue, stepSize, handlerCount } = o;
    if (this.modelOptions) {
      const mo = this.modelOptions;
      // Re-render on options change:
      if (minValue !== mo.minValue || maxValue !== mo.maxValue) {
        this.modelOptions.minValue = minValue;
        this.modelOptions.maxValue = maxValue;

        // Update children
        this.children.scale.setConfig(o);
        this._updateHandlers();
      }
      if (stepSize !== mo.stepSize) {
        this.modelOptions.stepSize = stepSize;

        // Update children
        this.children.scale.setConfig(o);
      }
      if (handlerCount !== mo.handlerCount) {
        this.modelOptions.handlerCount = handlerCount;

        // Update children
        this._createHandlers();
        this.update();
      }
    } else {
      // First time
      this.modelOptions = { minValue, maxValue, stepSize, handlerCount };
    }

    return this.modelOptions;
  }

  public addScale(o: ModelOptions) {
    const scale = new RScale(this.container, o);

    // Save to this
    this.children.scale = scale;

    const scaleElement = scale.getElement();

    // Append to slider and save to UI object
    this.UI.scale = scaleElement;
    this.UI.slider.insertAdjacentElement('beforeend', scaleElement);

    // Update scale values
    this.children.scale.setValues(this.values);

    return scale;
  }

  private _areArraysEqual(a: number[], b: number[]) {
    return (
      a.length === b.length &&
      a.every((value, index) => {
        value === b[index];
      })
    );
  }

  public update() {
    // Move handlers
    this._updateHandlers();

    // Update progress
    if (this.options.progress) {
      this._updateProgress();
    }

    return this.values;
  }

  private _init(o: SliderOptions): void {
    this._configure(o);

    this.setModelOptions(o);

    this._render();
  }

  private _render() {
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
      this._createProgress();
    }

    return this.UI.slider;
  }

  private _createHandlers() {
    // Remove old handlers
    if (this.children.handlers.length > 0) {
      this.children.handlers.forEach((h) => h.getElement().remove());

      this.children.handlers = [];
    }

    // Add new handlers
    const { handlerCount } = this.modelOptions;

    for (let i = 0; i < handlerCount; i += 1) {
      const handler = this._addHandler(i);
      this.children.handlers[i] = handler;
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

  private _calcProgressCoords(): ProgressCoords {
    const { handlerCount } = this.modelOptions;
    const single = handlerCount === 1;

    const coord1 = single ? 0 : this._valueToCoord(this.values[0]);
    const coord2 = single
      ? this._valueToCoord(this.values[0])
      : this._valueToCoord(this.values[1]);

    return [coord1, coord2];
  }

  private _createProgress() {
    const coords = this._calcProgressCoords();
    const { isHorizontal } = this.options;

    this.children.progress = new Progress(coords, isHorizontal);

    this.UI.progress = this.children.progress.getElement();

    this.UI.track.appendChild(this.UI.progress);
  }

  private _updateProgress(): void {
    const coords = this._calcProgressCoords();

    this.children.progress.setCoords(coords);
  }

  private _toggleProgress(progress: boolean): void {
    // If slider is not rendered yet
    if (!this.UI.slider) {
      return;
    }

    // If slider has more than 2 handlers
    if (this.modelOptions.handlerCount > 2) {
      // Set to false and return
      this.options.progress = false;
      return;
    }

    if (progress && !this.UI.progress) {
      // Create and update progress
      this._createProgress();
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
    this.UI.activeHandler = handler;
    // Add listeners
    document.body.addEventListener('mousemove', this._boundDrag);
    document.body.addEventListener('mouseup', this._boundRelease);
  }

  private _updateHandlers() {
    this.children.handlers.forEach((handler, index) => {
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
    const handler = this.children.handlers[closestIndex].getElement();

    // Grab that handler
    this._grab(handler);

    // Update handler
    this._moveHander(coord);
  }

  private _moveHander(coord: number) {
    // Convert coord to value
    const value = this._coordToValue(coord);

    // Update model through presenter
    const index = parseInt(this.UI.activeHandler.dataset.id, 10);
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
    this.UI.activeHandler = null;
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
      this.children.progress.toggleHorizontal(this.options.isHorizontal);

      this._updateProgress();
    }

    // Update scale
    if (this.UI.scale) {
      const layout = horizontal ? 'horizontal' : 'vertical';
      this.children.scale.toggleLayout(layout);
    }

    // Update handlers
    const layout = horizontal ? 'horizontal' : 'vertical';
    this.children.handlers.forEach((h) => h.toggleLayout(layout));
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
    this.children.handlers.forEach((h) => h.toggleTooltip(this.options.tooltip));

    // Progress
    if (typeof progress === 'boolean') {
      // Set value
      this.options.progress = progress;
    } else if (this.options.progress === undefined) {
      // Default value
      this.options.progress = false;
    }

    this._toggleProgress(this.options.progress);

    // Update scale
    if (this.children.scale) {
      this.children.scale.setConfig({ ...this.options, ...this.modelOptions });
    }

    return this.options;
  }
}

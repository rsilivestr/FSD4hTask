// eslint-disable-next-line no-unused-vars
import { Subject, Observer } from './interfaces';

interface ModelOptions {
  minValue?: number;
  maxValue?: number;
  stepSize?: number;
  handlerCount?: number;
  range?: boolean;
}

export default class RSModel implements Subject {
  observers: Observer[] = [];

  public options: ModelOptions = {};

  stepSizePerc;

  handlerValues: number[] = [];

  // handlerCoords: number[] = [];

  constructor(options?: ModelOptions) {
    this.options.minValue = options.minValue || -20;
    this.options.maxValue = options.maxValue || 60;
    this.options.stepSize = options.stepSize || 10;
    this.options.handlerCount = options.handlerCount || 1;
    this.options.range = options.range || false;

    const scaleLength = this.options.maxValue - this.options.minValue;
    this.stepSizePerc = Math.abs((this.options.stepSize / scaleLength) * 100);

    this.handlerValues = this.setValues();

    // this.handlerCoords = this.setCoords();
  }

  addObserver(o: Observer) {
    this.observers.push(o);
  }

  removeObserver(o: Observer) {
    this.observers = this.observers.filter((fn) => {
      if (fn === o) {
        return fn;
      }
      return null;
    });
  }

  notifyObservers() {
    this.observers.forEach((o) => {
      o.update(this.handlerValues);
    });
  }

  getOptions() {
    return this.options;
  }

  setOptions(options: ModelOptions) {
    // for (const { key, value } of Object.entries(options)) {
    //   this.options[key] = value;
    // }

    // for (const key in options) {
    //   if ({}.hasOwnProperty.call(options, key)) {
    //     this.options[key] = options[key];
    //   }
    // }

    Object.keys(options).forEach((key) => {
      this.options[key] = options[key];
    });
  }

  normalizeHandlerValue(index, value) {
    // value is a coordinate
    const x = value + this.stepSizePerc / 2;
    // normalized value is coordinate of the closest step value
    const normalizedCoord = x - (x % this.stepSizePerc);

    const stepsToMax = this.handlerValues.length - (index + 1);
    // theese are percentage coords too
    const minIndexCoord = this.stepSizePerc * index;
    const maxIndexCoord = 100 - this.stepSizePerc * stepsToMax;

    if (normalizedCoord > maxIndexCoord) {
      return maxIndexCoord;
    }
    if (normalizedCoord < minIndexCoord) {
      return minIndexCoord;
    }
    return normalizedCoord;
  }

  coordToValue(coord) {
    const { minValue, stepSize } = this.options;
    const factor = stepSize / this.stepSizePerc;
    const value = coord * factor + minValue;
    return value;
  }

  updateHandlers(index, coord) {
    const normalizedCoord = this.normalizeHandlerValue(index, coord);
    const normalizedValue = this.coordToValue(normalizedCoord);

    this.handlerValues[index] = normalizedValue;

    const values = this.handlerValues;

    for (let idx = 0; idx < values.length; idx += 1) {
      const val = values[idx];

      let newValue = normalizedValue;
      let newCoord = normalizedCoord;

      if (idx === index + 1 && val <= normalizedValue) {
        newValue = normalizedValue + this.options.stepSize;
        newCoord = normalizedCoord + this.stepSizePerc;
        this.handlerValues[idx] = newValue;
        this.updateHandlers(idx, newCoord);
      } else if (idx === index - 1 && val >= normalizedValue) {
        newValue = normalizedValue - this.options.stepSize;
        newCoord = normalizedCoord - this.stepSizePerc;
        this.handlerValues[idx] = newValue;
        this.updateHandlers(idx, newCoord);
      }
    }

    this.notifyObservers();
  }

  // starting values are hardcoded
  setValues() {
    const arr = [];

    arr.length = this.options.handlerCount;

    let index = 0;
    let value = this.options.minValue;

    while (index < arr.length) {
      arr[index] = value;
      index += 1;
      value += this.options.stepSize;
    }

    return arr;
  }
}
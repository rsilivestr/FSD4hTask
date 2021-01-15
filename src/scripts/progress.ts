export interface IProgress {
  getElement: () => HTMLDivElement;
  setCoords: (coords: ProgressCoords) => void;
  toggleHorizontal: (isHorizontal: boolean) => void;
}

export type ProgressCoords = [number, number];

export default class Progress {
  private coords: ProgressCoords = [0, 0];
  private isHorizontal: boolean = null;
  private UIprogress: HTMLDivElement = document.createElement('div');

  constructor(coords: ProgressCoords, isHorizontal: boolean) {
    this.UIprogress.className = 'rslider__progress';

    this.setCoords(coords);

    this.toggleHorizontal(isHorizontal);
  }

  public getElement(): HTMLDivElement {
    return this.UIprogress;
  }

  public setCoords(coords: ProgressCoords): void {
    this.coords = coords;

    if (typeof this.isHorizontal === 'boolean') {
      this._setStyle();
    }
  }

  public toggleHorizontal(isHorizontal: boolean): void {
    this.isHorizontal = isHorizontal;

    this.UIprogress.removeAttribute('style');

    this._setStyle();
  }

  private _setStyle(): void {
    const min = `${this.coords[0].toString(10)}%`;
    const max = `${(100 - this.coords[1]).toString(10)}%`;

    if (this.isHorizontal) {
      this.UIprogress.style.left = min;
      this.UIprogress.style.right = max;
    } else {
      this.UIprogress.style.bottom = min;
      this.UIprogress.style.top = max;
    }
  }
}

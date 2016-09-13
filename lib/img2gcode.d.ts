declare namespace imgToCode {
  export type ColorObject = { r: number, g: number, b: number, a?: number };
  export type Color = string | [number, number, number, number] | ColorObject;
  export type Axes = { x?: number, y?: number, z?: number | boolean };
  export type Pixel = { intensity: number, axes: Axes, be: boolean };

  export interface config {
    toolDiameter: number;
    scaleAxes: number;
    totalStep: number;
    deepStep: number;
    imgSize?: string;
    dirImg: string;
    whiteZ: number;
    blackZ: number;
    sevaZ: number;
  }

  export class Line {
    constructor(axes: Axes, comment?: string);

    public axes: Axes;
    public comment: string;
    public code(step?: number): string;
  }

}
// 0 X width
// Y height
declare namespace imgToCode {
  export type ColorObject = { r: number, g: number, b: number, a?: number };
  export type Color = string | [number, number, number, number] | ColorObject;
  export type Axes = { x?: number, y?: number, z?: number | boolean };
  export type Pixel = { intensity: number, axes: Axes, be: boolean };
  export type PixelToMM = { diameter: number; toMm: number; } // 1 pixel es X mm
  export type config = {
    errBlackPixel?: number; //unprocessedBlackPixel
    toolDiameter: number;
    scaleAxes: number;
    deepStep: number;
    imgSize?: string;
    //analyzeLevel:number;
    dirImg: string;
    whiteZ: number;
    blackZ: number;
    sevaZ: number;
  }

  export interface Image {
    height: number;
    width: number;
    pixels: imgToCode.Pixel[][];
  }
  export interface startPromise {
    config: config;
    dirgcode: string;
  }


  export class Line {
    constructor(axes: Axes, comment?: string);

    public axes: Axes;
    public comment: string;
    public code(step?: number): string;
  }

  export function start(config: imgToCode.config): Promise<{}>

}
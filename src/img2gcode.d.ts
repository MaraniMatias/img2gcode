// 0 X width
// Y height
declare namespace ImgToGCode {
  export type ColorObject = { r: number; g: number; b: number; a?: number };
  export type Color = string | [number, number, number, number] | ColorObject;
  export type Axes = {
    x?: number;
    y?: number;
    z?: { val: number; safe: boolean };
    m?: string;
    f?: number;
  };
  export type Pixel = {
    intensity: number;
    x?: number;
    y?: number;
    z?: { val: number; safe: boolean };
    be: boolean;
  };
  export type PixelToMM = { diameter: number; toMm: number }; // 1 pixel es X mm
  export type Config = {
    errBlackPixel?: number; //unprocessedBlackPixel
    toolDiameter: number;
    sensitivity?: number; //intensity sensitivity
    scaleAxes?: number;
    // Only the corresponding line is added.
    feedrate?: {
      work: number;
      idle: number;
    };
    invest?: {
      x: boolean;
      y: boolean;
    };
    deepStep?: number;
    imgSize?: string;
    dirImg: string;
    whiteZ?: number;
    blackZ: number;
    laser?: {
      commandPowerOn: string;
      commandPowerOff: string;
    };
    safeZ: number;
    info?: string; // ["none" | "console" | "emitter"]
    time?: number;
  };

  export interface Image {
    height: number;
    width: number;
    pixels: Pixel[][];
  }

  export class Line {
    constructor(axes: Axes, comment?: string);

    public axes: Axes;
    public comment: string;
    public code(step?: number): string;
  }

  export class Main {
    /**
     * @param {string} event
     *  event "tick" returns {number} nro 0 (0%) to 1 (100%)
     *  event "init" returns {string}
     *  event "log" returns {string}
     *  event "error" returns {Error}
     *  event "complete" returns { config: ImgToGCode.Config, dirgcode: string }
     * @param {Function} listener
     * @returns {this}
     *
     * @memberOf Main
     */
    on(event: string, listener: Function): this;
    /**
     *It is mm
     *
     *@param {
     *  toolDiameter: 2,
     *  scaleAxes: 40,
     *  deepStep: -1,
     *  whiteZ: 0,
     *  blackZ: -2,
     *  sevaZ: 2,
     *  info: ["none" | "console" | "emitter"],
     *  dirImg:'./img/test.png'
     *}
     * @memberOf main
     */
    start(config: ImgToGCode.Config): this;
    /**
     *
     *
     * @param {({ config: ImgToGCode.Config, dirgcode: string })} cb
     * @returns {this}
     *
     * @memberOf Main
     */
    then(cb: { config: ImgToGCode.Config; dirgcode: string }): this;
  }
}

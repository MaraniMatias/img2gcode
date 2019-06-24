import Utilities from "./utilities";
import Analyze from "./analyze";
import Line from "./line";
import File from "./file";
import * as path from "path";
import * as Jimp from "jimp";
// const Jimp = require("jimp");
import { EventEmitter } from "events";

export class Main extends EventEmitter {
  private _typeInfo: string = "none"; // ["none" | "console" | "emitter"]
  private _then: Function;
  private _gCode: ImgToGCode.Line[] = [];
  private _img: ImgToGCode.Image = { height: 0, width: 0, pixels: [] };
  private _pixel: ImgToGCode.PixelToMM = { diameter: 1, toMm: 1 }; // 1 pixel es X mm
  private _progress: number = 0;

  private tick(nro: number) {
    if (this._typeInfo === "console") {
      console.log(Utilities.round(nro) + "%");
    } else if (this._typeInfo === "emitter") {
      this.emit("tick", nro);
    }
  }
  private log(str: string) {
    if (this._typeInfo === "console") {
      console.log(str);
    } else if (this._typeInfo === "emitter") {
      this.emit("log", str);
    }
  }
  private error(err: Error | string) {
    let srt = typeof err === "string" ? new Error(<string>err) : err;
    if (this._typeInfo === "emitter") {
      this.emit("error", srt);
    } else {
      throw srt;
    }
  }

  public then(cb: Function): this {
    this._then = cb;
    return this;
  }

  private isImg(extension: string): boolean {
    return /\.(png|jpe{0,1}g|gif)/i.test(extension);
  }

  private reSet(): void {
    this._gCode = [];
    this._img = { height: 0, width: 0, pixels: [] };
    this._pixel = { diameter: 1, toMm: 1 };
    this._progress = 0;
  }

  public start(config: ImgToGCode.Config): this {
    // Reset variables
    this.reSet();
    if (this.isImg(path.extname(config.dirImg))) {
      (config.toolDiameter && typeof config.toolDiameter === "number") ||
        this.error("ToolDiameter undefined or is't number.");
      (config.blackZ && typeof config.blackZ === "number") ||
        this.error("Black distance z undefined or is't number.");
      (config.safeZ && typeof config.safeZ === "number") ||
        this.error("Safe distance z undefined or is't number.");
      (config.dirImg && typeof config.dirImg === "string") ||
        this.error("Address undefined Image or is't string.");
      if (config.laser) {
        (typeof config.laser.commandPowerOn === "string" &&
          typeof config.laser.commandPowerOff === "string") ||
          this.error("Laser options are not string.");
      }
      config.sensitivity =
        config.sensitivity <= 1 && config.sensitivity >= 0 ? config.sensitivity : 0.95;
      config.deepStep = (typeof config.deepStep === "number" && config.deepStep) || -1;
      config.whiteZ = (typeof config.whiteZ === "number" && config.whiteZ) || 0;
      config.time = +new Date();
      if (config.invest) {
        config.invest.x = typeof config.invest.x === "boolean" ? config.invest.x : true;
        config.invest.y = typeof config.invest.y === "boolean" ? config.invest.y : true;
      } else {
        config.invest = { x: false, y: true };
      }
      if (config.feedrate) {
        config.feedrate.work =
          (typeof config.feedrate.work === "number" && config.feedrate.work) || 0;
        config.feedrate.idle =
          (typeof config.feedrate.idle === "number" && config.feedrate.idle) || 0;
      } else {
        config.feedrate = { work: NaN, idle: NaN };
      }
      this._typeInfo = (typeof config.info === "string" && config.info) || "none";
      this.log("-> Image: " + config.dirImg);

      const self = this;
      this.run(config)
        .then(dirgcode => {
          if (typeof self._then === "function") self._then({ dirgcode, config });
          if (self._typeInfo === "emitter") self.emit("complete", { dirgcode, config });
        })
        .catch(err => self.error(err));
    }
    return this;
  }

  private run(config: ImgToGCode.Config) {
    let self = this;
    return new Promise((resolve, reject) => {
      self
        .loading(config)
        .then((config: ImgToGCode.Config) => self.analyze(config, resolve))
        .catch(reject);
    });
  }

  private analyze(config: ImgToGCode.Config, fulfill: (dirGCode: string) => void) {
    try {
      this.tick(0);
      let firstPixel: ImgToGCode.Pixel[][] = Analyze.getFirstPixel(this._img, this._pixel);
      this.addPixel(
        { x: firstPixel[0][0].x, y: firstPixel[0][0].y, f: config.feedrate.idle },
        config
      );

      let w = 0;
      while (w <= config.errBlackPixel) {
        this.tick(this._progress / config.errBlackPixel);
        let nexPixels = Analyze.nextBlackToMove(firstPixel, this._img, this._pixel);
        if (!nexPixels) {
          this.tick(1);
          config.errBlackPixel = Utilities.round(
            (Utilities.size(this._img.pixels) * 100) / config.errBlackPixel
          );
          this.log("-> " + config.errBlackPixel + "% of black pixels unprocessed.");
          this.log("-> Accommodating gcode...");
          File.save(this._gCode, config).then((dirGCode: string) => {
            this.log("-> Sava As: " + dirGCode);
            fulfill(dirGCode);
          });
          break;
        }
        firstPixel = this.toGCode(firstPixel, nexPixels, config);
        w++;
      }
    } catch (error) {
      this.error("\nError processing image gcode, may be for settings.");
    }
  }

  private loading(config: ImgToGCode.Config) {
    let self = this;

    return new Promise((fulfill, reject) => {
      Jimp.read(config.dirImg)
        .then(image => {
          self.log("-> Openping and reading...");
          self._img.height = image.bitmap.height;
          self._img.width = image.bitmap.width;

          self._pixel.toMm =
            typeof config.scaleAxes !== "undefined" && config.scaleAxes !== self._img.height
              ? (self._pixel.toMm = Utilities.round(config.scaleAxes / self._img.height))
              : 1;
          self._pixel.diameter = Utilities.round(config.toolDiameter / self._pixel.toMm);
          let squareImg = self.getAllPixel(image, config);
          self._img.pixels = squareImg;
          self._img.height = squareImg.length;
          self._img.width = squareImg.length;

          config.errBlackPixel = Utilities.size(self._img.pixels);
          config.imgSize =
            "(" +
            image.bitmap.height +
            "," +
            image.bitmap.width +
            ")pixel to (" +
            Utilities.round(image.bitmap.height * self._pixel.toMm) +
            "," +
            Utilities.round(image.bitmap.width * self._pixel.toMm) +
            ")mm";
          fulfill(config);
        })
        .catch((err: any) => {
          reject(new Error("File not found.\n" + err.message));
        });
    });
  }

  private toGCode(
    oldPixel: ImgToGCode.Pixel[][],
    newPixel: ImgToGCode.Pixel[][],
    config: ImgToGCode.Config
  ): ImgToGCode.Pixel[][] {
    try {
      let pixelLast = newPixel[0][0],
        pixelFist = oldPixel[0][0];

      if (Utilities.distanceIsOne(oldPixel, newPixel)) {
        this.addPixel(
          {
            x: pixelFist.x + (pixelLast.x - pixelFist.x),
            y: pixelFist.y + (pixelLast.y - pixelFist.y),
            z: {
              val: Utilities.resolveZ(newPixel, config.whiteZ, config.blackZ),
              safe: false
            },
            m: config.laser ? config.laser.commandPowerOn : void 0
          },
          config
        );
      } else {
        this.addPixel(
          {
            z: { val: config.safeZ, safe: true },
            m: config.laser ? config.laser.commandPowerOff : void 0,
            f: config.feedrate.idle
          },
          config
        );
        this.addPixel(
          {
            x: pixelFist.x + (pixelLast.x - pixelFist.x),
            y: pixelFist.y + (pixelLast.y - pixelFist.y),
            z: { val: config.safeZ, safe: true },
            m: config.laser ? config.laser.commandPowerOff : void 0,
            f: config.feedrate.idle
          },
          config
        );
        this.addPixel(
          {
            z: {
              val: Utilities.resolveZ(newPixel, config.whiteZ, config.blackZ),
              safe: false
            },
            m: config.laser ? config.laser.commandPowerOn : void 0,
            f: config.feedrate.work
          },
          config
        );
      }

      Utilities.appliedAllPixel(newPixel, (p: ImgToGCode.Pixel) => {
        this._progress++;
        p.be = true;
      });
      return newPixel;
    } catch (error) {
      this.error("Pixels are not valid for this configuration.");
    }
  }

  private addPixel(axes: ImgToGCode.Axes, config: ImgToGCode.Config) {
    try {
      let sum = this._pixel.diameter / 2;
      let X = axes.x && (axes.x + sum) * this._pixel.toMm;
      let Y = axes.y && (axes.y + sum) * this._pixel.toMm;
      if (this._gCode.length === 0) {
        const comment = config.laser
          ? `X0 Y0 ${config.laser.commandPowerOff} Line Init`
          : `X0 Y0 Z${config.safeZ} Line Init`;
        this._gCode.push(
          new Line(
            {
              x: 0,
              y: 0,
              z: { val: config.safeZ, safe: true },
              m: config.laser ? config.laser.commandPowerOff : void 0
            },
            config.invest,
            comment
          )
        );
        this._gCode.push(
          new Line(
            {
              x: X,
              y: Y,
              z: { val: config.safeZ, safe: true },
              m: config.laser ? config.laser.commandPowerOff : void 0
            },
            config.invest,
            config.laser ? "Laser off" : "With Z max "
          )
        );
      }
      this._gCode.push(
        new Line({ x: X, y: Y, z: axes.z, f: axes.f, m: axes.m }, config.invest)
      );
    } catch (error) {
      this.error("Failed to build a line.");
    }
  }

  private getAllPixel(image: any, config: ImgToGCode.Config): ImgToGCode.Pixel[][] {
    try {
      let self = this;

      function intensityFix(colour: ImgToGCode.ColorObject) {
        return (colour.r + colour.g + colour.b) * (colour.a > 1 ? colour.a / 100 : 1);
      }
      let newArray: ImgToGCode.Pixel[][] = [];
      for (let x = 0, xl = this._img.width; x < xl; x++) {
        let row: ImgToGCode.Pixel[] = [];
        for (let y = 0, yl = this._img.height; y < yl; y++) {
          let intensity = intensityFix(Jimp.intToRGBA(image.getPixelColour(x, y)));
          row.push({
            x,
            y,
            be: intensity >= 765 * config.sensitivity,
            intensity: intensity < 765 * config.sensitivity ? intensity : 765
          });
        }
        newArray.push(row);
      }
      return self.normalizeImg(newArray);
    } catch (error) {
      this.error("Error processing image.");
    }
  }

  private normalizeImg(img: ImgToGCode.Pixel[][]): ImgToGCode.Pixel[][] {
    try {
      let row = img.length - 1,
        column = img[img.length - 1].length - 1;
      // x -> w column
      // y -> h row
      function addRow(image: ImgToGCode.Pixel[][]) {
        for (let y = row; y < column; y++) {
          let newRow: ImgToGCode.Pixel[] = [];
          for (let x = 0; x < column; x++) {
            newRow.push({
              x,
              y,
              be: true,
              intensity: 765
            });
          }
          image.push(newRow);
        }
        return image;
      }

      function addColumn(image: ImgToGCode.Pixel[][]) {
        for (let x = column; x < row; x++) {
          for (let y = 0; y <= row; y++) {
            image[y].push({
              x,
              y,
              be: true,
              intensity: 765
            });
          }
        }
        return image;
      }
      return row < column ? addRow(img) : addColumn(img);
    } catch (error) {
      this.error("Error processing image.");
    }
  }
} // class

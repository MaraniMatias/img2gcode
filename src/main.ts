import Utilities from "./utilities";
import Analyze from "./analyze";
import Line from "./line";
import File from "./file";
import * as lwip  from 'lwip';
import {EventEmitter}  from 'events';

export class Main extends EventEmitter {
  private _gCode: ImgToGCode.Line[] = [];
  private _img: ImgToGCode.Image = {};
  private _pixel: ImgToGCode.PixelToMM = {}; // 1 pixel es X mm
  /**
  * @param {number} nro 0 to 1
  */
  private tick(nro: number) { this.emit('tick', nro); }
  private log(str: string) { this.emit('log', str); }
  private error(err: Error | string) {
    this.emit('error', typeof (err) === "string" ? new Error(<string>err) : err);
  }

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
   *  dirImg:'./img/test.png'
   *}
   * @memberOf main
   */
  public start(config: ImgToGCode.Config) {
    try {
      this.log(`-> Image: ${config.dirImg}`);
      let self = this;
      new Promise(function (fulfill, reject) {
        lwip.open(config.dirImg, function (err: Error, image) {
          if (err) self.error(err.message);
          self.log('-> Openping and reading...');

          self._img.height = image.height();
          self._img.width = image.width();
          self._img.pixels = self.getAllPixel(image);
          self._pixel.toMm = Utilities.round(config.scaleAxes / self._img.height);
          self._pixel.diameter = Utilities.round(config.toolDiameter / self._pixel.toMm);

          config.errBlackPixel = Utilities.size(self._img.pixels);
          config.imgSize = `(${self._img.height},${self._img.width})pixel to (${Utilities.round(self._img.height * self._pixel.toMm)},${Utilities.round(self._img.width * self._pixel.toMm)})mm`
          fulfill(config);
        });
      })
        .then((config: ImgToGCode.Config) => {
          self.analyze(config, (dirgcode: string) => {
            self.emit('complete', { dirgcode, config });
          });
        });
    } catch (err) {
      this.error(err);
    }
  }

  private analyze(config: ImgToGCode.Config, fulfill: (dirGCode: string) => void) {
    try {
      let firstPixel: ImgToGCode.Pixel[][] = Analyze.getFirstPixel(this._img, this._pixel);
      this.addPixel({
        x: firstPixel[0][0].axes.x,
        y: firstPixel[0][0].axes.y
      }, config.sevaZ);

      let w = 0;
      while (w <= config.errBlackPixel) {
        this.tick(w / config.errBlackPixel);
        let nexPixels = Analyze.nextBlackToMove(firstPixel, this._img, this._pixel);
        if (!nexPixels) {
          config.errBlackPixel = Utilities.round(Utilities.size(this._img.pixels) * 100 / config.errBlackPixel);
          this.tick(1);
          this.log(`-> ${config.errBlackPixel}% of black pixels unprocessed.`);
          this.log("-> Accommodating gcode...");
          File.save(this._gCode, config).then((dirGCode: string) => {
            this.log(`-> Sava As: ${dirGCode}`);
            fulfill(dirGCode);
          });
          break;
        }
        firstPixel = this.toGCode(firstPixel, nexPixels, config.sevaZ);
        w++;
      }
    } catch (error) {
      this.error('Error processing image gcode, may be for settings.');
      console.error(error);
    }
  }

  private toGCode(oldPixel: ImgToGCode.Pixel[][], newPixel: ImgToGCode.Pixel[][], sevaZ: number): ImgToGCode.Pixel[][] {
    try {
      let pixelLast = newPixel[0][0], pixelFist = oldPixel[0][0];
      if (Utilities.distanceIsOne(oldPixel, newPixel)) {
        this.addPixel({
          x: pixelFist.axes.x + (pixelLast.axes.x - pixelFist.axes.x),
          y: pixelFist.axes.y + (pixelLast.axes.y - pixelFist.axes.y),
          z: false
        });
      } else {
        this.addPixel({
          z: sevaZ
        });
        this.addPixel({
          x: pixelFist.axes.x + (pixelLast.axes.x - pixelFist.axes.x),
          y: pixelFist.axes.y + (pixelLast.axes.y - pixelFist.axes.y),
          z: sevaZ
        });
        this.addPixel({
          z: false
        });
      }

      Utilities.appliedAllPixel(newPixel, (p: ImgToGCode.Pixel) => { p.be = true; });
      return newPixel;
    } catch (error) {
      console.error("oldPixel", oldPixel, "\nnewPixel", newPixel, 'error:\n', error);
      this.error("Pixels are not valid for this configuration.")
    }
  }

  private addPixel(axes: ImgToGCode.Axes, sevaZ?: number | boolean) {
    try {
      let sum = this._pixel.diameter / 2;
      let X = axes.x ? (axes.x + sum) * this._pixel.toMm : undefined;
      let Y = axes.y ? (axes.y + sum) * this._pixel.toMm : undefined;
      if (this._gCode.length === 0) {
        this._gCode.push(new Line({ x: 0, y: 0, z: sevaZ }, `X0 Y0 Z${sevaZ} Line Init`));
        this._gCode.push(new Line({ x: X, y: Y, z: sevaZ }, 'With Z max '));
      }
      this._gCode.push(new Line({ x: X, y: Y, z: axes.z }));
    } catch (error) {
      this.error('Failed to build a line.');
      console.error('AddPixel > G01 ' + axes.x ? `X${axes.x ? (axes.x + this._pixel.diameter / 2) * this._pixel.toMm : undefined}` : '' + axes.y ? `Y${axes.x ? (axes.x + this._pixel.diameter / 2) * this._pixel.toMm : undefined}` : '' + axes.z !== undefined ? `Z${axes.z};` : ';' + `\n ${error}`);
    }
  }

  /**
   * @param {lwip.Image} image
   * @returns {Pixel[][]}
   */
  private getAllPixel(image: lwip.Image): ImgToGCode.Pixel[][] {
    try {
      function intensityFix(colour: lwip.ColorObject) {
        return (colour.r + colour.g + colour.b) * ((colour.a > 1) ? colour.a / 100 : 1) < 10 ? 0 : 765;
      }
      let newArray = [];
      for (let x = 0; x < image.width(); x++) {
        let row = []
        for (let y = 0; y < image.height(); y++) {
          let intensity = intensityFix(image.getPixel(x, y));
          row.push({ axes: { x, y }, intensity, be: intensity !== 0 });
        }
        newArray.push(row);
      }
      return newArray;
    } catch (error) {
      this.error('Error loading image.');
      console.error(error);
    }
  }

}// class
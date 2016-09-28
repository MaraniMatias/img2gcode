import * as path  from 'path';
import * as fs from "fs";

export default
  /**
  * File
  */
  class File {
  private static _gCodeInit: string[] = [
    ";---> this code is for cnc-ino <---",
    'G21 ; Set units to mm',
    'G90 ; Absolute positioning'
  ]

  private static concat(gcode: ImgToGCode.Line[], config: ImgToGCode.Config): string[] {
    try {
      let totalStep = (config.blackZ - config.whiteZ) / config.deepStep;
      for (let count = 0, step = config.deepStep; count < totalStep; count++ , step += config.deepStep) {
        for (let index = 0, x = gcode.length; index < x; index++) {
          this._gCodeInit.push(gcode[index].code(-step / totalStep));
        }
        let e = gcode[gcode.length - 1];
        let x = e.axes.x ? ' X' + e.axes.x : '';
        let y = e.axes.y ? ' Y-' + e.axes.y : '';
        this._gCodeInit.push(`G01${x}${y} Z${config.safeZ}; With new deep step`);
      }
      this._gCodeInit.push(`G01 Z${config.safeZ}; With Z max`);
      return this._gCodeInit;
    } catch (error) {
      throw error
    }
  }

  /**
   * Save 
   * 
   * @param {string} dirGCode path the gCode file
   * @param {Line[]} gCode array de lineas para converti en gcode
   */
  public static save(gcode: ImgToGCode.Line[], config: ImgToGCode.Config) {
    var self = this;
    return new Promise(function (fulfill, reject) {
      try {
        let dirimg = path.resolve(config.dirImg),
          dirgcode = dirimg.substring(0, dirimg.lastIndexOf(".")) + '.gcode';
        self._gCodeInit.push(
          `; ${dirimg}`,
          `; ${dirgcode}`,
          `; Img Size: ${config.imgSize}`,
          `; Process Error: ${config.errBlackPixel}%`,
          `; Tool Diameter: ${config.toolDiameter}`,
          `; Scale Axes: ${config.scaleAxes}`,
          `; Deep Step: ${config.deepStep}`,
          `; Z Save: ${config.safeZ}`,
          `; Z White: ${config.whiteZ}`,
          `; Z Black: ${config.blackZ}`
        );
        self.writeFile(dirgcode, self.concat(gcode, config).join('\n'))
          .then((dirGCode) => { fulfill(dirGCode); });
      } catch (error) {
        fulfill(error);
      }
    });
  }

  private static writeFile(dirgcode: string, data: string) {
    return new Promise(function (fulfill, reject) {
      fs.unlink(dirgcode, (err) => {
        fs.writeFile(path.resolve(dirgcode), data, { encoding: "utf8" }, (err) => {
          if (err) reject(err);
          else fulfill(path.resolve(dirgcode));
        });
      });
    });
  }

}// class
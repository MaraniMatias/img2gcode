import * as path  from 'path';
import * as fs from "fs";

export default
 /**
 * File
 */
class File {

  /**
   * Creates an instance of File.
   * 
   * @param {string[]} [gCodeInit]
   */
  constructor( gCodeInit ?:string[] ) {
    if(gCodeInit){
      this._gCodeInit = gCodeInit;
    }else{
      this._gCodeInit = [
        ";---> this code is for cnc-ino <---",
        'G21 ; Set units to mm',
        'G90 ; Absolute positioning'
      ]
    }
  }
  
  private _gCodeInit: string[];

  private concat(gcode: imgToCode.Line[],config: imgToCode.config): string[] {
    try {
      let totalStep = (config.blackZ - config.whiteZ) / config.deepStep;
      for (let count = 0, step = config.deepStep; count < totalStep; count++ , step = step + config.deepStep) {
        for (let index = 0; index < gcode.length; index++) {
          let e = gcode[index];
          this._gCodeInit.push(e.code(step));
        }
        let e = gcode[gcode.length-1];
        this._gCodeInit.push(`G01 X${e.axes.x} Y-${e.axes.y} Z${config.sevaZ}; With new deep step`);
      }
      this._gCodeInit.push(`G01 Z${config.sevaZ}; With Z max`);
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
  public save(gcode: imgToCode.Line[], config: imgToCode.config) {
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
          `; Z Save: ${config.sevaZ}`,
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

  private writeFile(dirgcode: string, data: string ) {
    return new Promise(function (fulfill, reject) {
      fs.unlink(dirgcode, (err) => {
        fs.writeFile(dirgcode, data, { encoding: "utf8" }, (err) => {
          if (err) reject(err);
          else fulfill(dirgcode);
        });
      });
    });
  }

}// class
type Axes = { x?:number, y?:number, z?:number|boolean };
import Line from "./line";
interface config {
  toolDiameter: number;
  scaleAxes: number;
  totalStep: number;
  deepStep: number;
  imgSize: string;
  whiteZ: number;
  blackZ: number;
  sevaZ: number;
  dir : {
    gCode: string;
    img: string;
  }
}

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
  
  private _gCodeInit : string[];
  private concat(gcode: Line[],config: config): string[] {
    for (let count = 0, step = 0; count <= config.totalStep; count++ , step = step + config.deepStep) {
      for (let index = 0; index < gcode.length; index++) {
        let e = gcode[index];
        this._gCodeInit.push(e.code(step));
      }
      let e = gcode[gcode.length-1];
      this._gCodeInit.push(`G01 X${e.axes.x} Y${e.axes.y} Z${config.sevaZ}; With new deep step`);
    }
    this._gCodeInit.push(`G01 Z${config.sevaZ}; With Z max`);
    return this._gCodeInit;
  }
  
  /**
   * Save 
   * 
   * @param {string} dirGCode path the gCode file
   * @param {Line[]} gCode array de lineas para converti en gcode
   */
  public save(gcode:Line[],config: config, cb?: (dirGCode: string) => void) {
    this._gCodeInit.push(
      `; ${config.dir.img}`,
      `; ${config.dir.gCode}`,
      `; Img Size: ${config.imgSize}`,
      `; Tool Diameter: ${config.toolDiameter}`,
      `; Scale Axes: ${config.scaleAxes}`,
      `; Deep Step: ${config.deepStep}`,
      `; Z Save: ${config.sevaZ}`,
      `; Z White: ${config.whiteZ}`,
      `; Z Black: ${config.blackZ}`
    );
    fs.unlink(config.dir.gCode,(err)=>{
      fs.writeFile(config.dir.gCode, this.concat(gcode,config).join('\n'),{ encoding: "utf8" },(err)=>{
        if(err) throw err.message;
        if(cb) cb(config.dir.gCode);
      });
    });
  }
}
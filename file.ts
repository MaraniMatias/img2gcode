type Axes = { x?:number, y?:number, z?:number|boolean };
interface Line {
  comment: string;
  _axes: Axes;
  code(step:number)   :string;
}
interface config {
  gcode: Line[];
  totalStep: number;
  deepStep: number;
  sevaZ: number;
  dir: string;
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
  private concat(config: config): string[] {
    for (let count = 0, step = 0; count <= config.totalStep; count++ , step = step + config.deepStep) {
      for (let index = 0; index < config.gcode.length; index++) {
        let element = config.gcode[index];
        this._gCodeInit.push(element.code(step));
      }
      let e = config.gcode[config.gcode.length-1];
      this._gCodeInit.push(`G01 X${e._axes.x} Y${e._axes.y} Z${config.sevaZ}; With new deep step`);
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
  public save(config: config, cb?: (dirGCode: string) => void) {
    fs.unlink(config.dir,(err)=>{
      fs.writeFile(config.dir, this.concat(config).join('\n'),{ encoding: "utf8" },(err)=>{
        if(err) throw err.message;
        if(cb) cb(config.dir);
      });
    });
  }
}
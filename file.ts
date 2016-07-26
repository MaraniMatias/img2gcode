type ColorObject = {r: number, g: number, b: number, a?: number};
type Axes = { x:number, y:number, z?:number};
interface Line {
  comment  :string;
  colour   :ColorObject;
  axes     :Axes;
  show     :boolean;
  code()   :string;
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
        'G21 ; Set units to mm',
        'G90 ; Absolute positioning',
        'G01 X0 Y0 Z765; con Z max',
      ]
    }
  }
  
  private _gCodeInit : string[];
  private concat(gCode: Line[]) :string[] {
    for (let index = 0; index < gCode.length; index++) {
      let element = gCode[index];
      if(element.show){ this._gCodeInit.push( element.code() ); }
    }
    return this._gCodeInit;
  }
  
  /**
   * Save 
   * 
   * @param {string} dirGCode path the gCode file
   * @param {Line[]} gCode array de lineas para converti en gcode
   */
  public save(dirGCode :string, gCode: Line[] , cb?: () => void ) {
    fs.unlink(dirGCode,(err)=>{
      
    });
    fs.writeFile(dirGCode, this.concat(gCode).join('\n'),{ encoding: "utf8" },(err)=>{
      if(err) throw err.message;
      if(cb) cb();
    });
  }
}
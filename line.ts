/// <reference path="./typings/globals/lwip/index.d.ts" />
type Pixel = { colour: ColorObject, intensity :number , axes:Axes };
type ColorObject = {r: number, g: number, b: number, a?: number};
type Axes = { x:number, y:number, z?:number};
/**
 * Line
 */
export default class Line { 
  /**
   * @param  {x:number; y:number; z?:number;} axes 
   * @param  {r:number; g:number; b:number; a:number;} colour?
   * @param  {string} comment? 
   */
  //constructor(show:boolean,axes:any,colour?:ColorObject,comment?:string){
  constructor(show :boolean,pixel :Pixel,comment ?:string){
    this._show = show;
    this._pixel = pixel;
    if(comment){ this._comment = comment; }
  }

  private _show : boolean;
  public get show() : boolean {
    return this._show;
  }
  public set show(v : boolean) {
    this._show = v;
  }

  private _comment : string;
  public get comment() : string {
    return this._comment;
  }
  public set comment(v : string) {
    this._comment = v;
  }
  
  private _pixel : Pixel;
  public get axes() : Axes {
    return this._pixel.axes;
  }
  public get colour() : ColorObject {
    return this._pixel.colour;
  }
  public get intensity() :number{
    return this._pixel.intensity;
  }

  /**
   * code
   * Arma code for that line with data
   */
  public code() : string {
    let show = this._show ? '':';';
    let x = this._pixel.axes.x!==undefined ? ` X${this._pixel.axes.x}`:'';
    let y = this._pixel.axes.y!==undefined ? ` Y${this._pixel.axes.y}`:'';
    let z = this._pixel.axes.z!==undefined ? ` Z${this._pixel.axes.z}`:'';
    let comment = this._comment ? `; ${this._comment}`:'';
    return show+"G01"+x+y+z+comment;
  }
}
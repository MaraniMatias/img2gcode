/// <reference path="./typings/globals/lwip/index.d.ts" />
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
  constructor(show:boolean,axes:any,colour?:ColorObject,comment?:string){
    this._axes = axes;
    this._show = show;
    if(this._colour){ this._colour=colour; }
    if(this._colour){ this._comment=comment; }
  }

  private _axes : Axes;
  public get axes() : Axes {
    return this._axes;
  }
  public set axes(v : Axes) {
    this._axes = v;
  }

  private _colour : ColorObject;
  public get colour() : ColorObject {
    return this._colour;
  }
  public set colour(v : ColorObject) {
    this._colour = v;
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
  
  /**
   * code
   * Arma code for that line with data
   */
  public code() : string {
    // si es solo un comentario G01 no estaria
    let s = this._show ? '':';';
    let x = this._axes.x!==undefined ? ` X${this._axes.x}`:'';
    let y = this._axes.y!==undefined ? ` Y${this._axes.y}`:'';
    let z = this._axes.z!==undefined ? ` Z${this._axes.z}`:'';
    let comment = this._comment ? `; ${this._comment}`:'';
    return s+"G01"+x+y+z+comment;
  }
}
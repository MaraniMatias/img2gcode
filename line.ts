interface pixel {r:number; g:number; b:number; a:number;}
interface axes { x:number; y:number; z?:number;}
/**
 * line
 */
export default class line {

  /*constructor( x: any ,y?:number,z?:number, comment? : string ) {
    if ( y ===undefined && z === undefined ) {
      this._code=x;
    } 
    if( x != undefined && y != undefined && z != undefined ) {
      this._x=x; this._y=y; this._z=z;
      this._code = `G01 X${this._x} Y${this._y} Z${this._z}`+ (comment ? ' ; ' + comment :'');
    }
    if(  x == Array(2) ){
      this._x = x[0];
      this._y = x[1];
      this._code = `G01 X${this._x} Y${this._y}`+ (comment ? ' ; ' + comment :'');
    }
  }*/

  
  /**
   * @param  {x:number; y:number; z?:number;} axes 
   * @param  {r:number; g:number; b:number; a:number;} colour?
   * @param  {string} comment? 
   */
  constructor(axes:any,colour?:pixel,comment?:string){
    this._axes=axes;
    if(this._colour){ this._colour=colour; }
    if(this._colour){ this._comment=comment; }
  }

  private _axes : axes;
  public get axes() : axes {
    return this._axes;
  }
  public set axes(v : axes) {
    this._axes = v;
  }

  private _colour : pixel;
  public get colour() : pixel {
    return this._colour;
  }
  public set colour(v : pixel) {
    this._colour = v;
  }
  
  /**
   * code
   * Arma code for that line with data
   */
  public code() : string {
    // si es solo un comentario G01 no estaria 
    let x = this._axes.x!==undefined ? ` X${this._axes.x}`:'';
    let y = this._axes.y!==undefined ? ` Y${this._axes.y}`:'';
    let z = this._axes.z!==undefined ? ` Z${this._axes.z}`:'';
    let comment = this._comment ? `; ${this._comment}`:'';
    return "G01"+x+y+z+comment;
  }
  
  private _comment : string;
  public get comment() : string {
    return this._comment;
  }
  public set comment(v : string) {
    this._comment = v;
  }
  
}


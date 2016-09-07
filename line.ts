type Axes = { x?:number, y?:number, z?:number};
/**
 * Line
 */
export default class Line { 
  /**
   * @param  {x?:number; y?:number; z?:number;} axes 
   * @param  {string} comment? 
   */
  constructor(axes :Axes,comment ?:string){
    this._axes = axes;
    if(comment){ this._comment = comment; }
  }

  private _comment: string;
  public get comment(): string {
    return this._comment;
  }
  public set comment(v: string) {
    this._comment = v;
  }

  private _axes: Axes;
  public get axes(): Axes {
    return this._axes;
  }

  /**
   * code
   * Arma code for that line with data
   */
  public code() : string {
    let x = this._axes.x!==undefined ? ` X${this._axes.x}`:'';
    let y = this._axes.y!==undefined ? ` Y${this._axes.y}`:'';
    let z = this._axes.z!==undefined ? ` Z${this._axes.z}`:'';
    let comment = this._comment ? `; ${this._comment}`:'';
    return "G01"+x+y+z+comment ;
  }
}
export default class Line {
  private _sign: {
    x: string;
    y: string;
  } = {
    x: "-",
    y: "-"
  }; //en file esta como Y-
  /*
   * @param  {x?:number; y?:number; z?:number;} axes
   * @param  {string} comment?
   */
  constructor(
    axes: ImgToGCode.Axes,
    invest: {
      x: boolean;
      y: boolean;
    },
    comment?: string
  ) {
    this._axes = axes;
    this._sign.x = (invest.x && "-") || "";
    this._sign.y = (invest.y && "-") || "";
    this._comment = comment || undefined;
  }

  private _comment: string;
  public get comment(): string {
    return this._comment;
  }
  public set comment(v: string) {
    this._comment = v;
  }

  private _axes: ImgToGCode.Axes;
  public get axes(): ImgToGCode.Axes {
    return this._axes;
  }

  /**
   * code
   * Arma code for that line with data
   */
  public code(percentage: number): string {
    let x = (this._axes.x && ` X${this._sign.x}${this._axes.x.toFixed(4)}`) || "";
    let y = (this._axes.y && ` Y${this._sign.y}${this._axes.y.toFixed(4)}`) || "";
    let z =
      (this._axes.m && " " + this._axes.m) ||
      (this._axes.z &&
        ` Z${
          this._axes.z.safe ? this._axes.z.val : (this._axes.z.val * percentage).toFixed(4)
        }`) ||
      "";
    let f = (this._axes.f && ` F${this._axes.f}`) || "";
    let comment = (this._comment && ` ;${this._comment}`) || "";
    return "G01" + x + y + z + f + comment;
  }
}

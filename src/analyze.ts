import Utilities from "./utilities";
export default class Analyze {

  /*
  Bprivate static _progress: number;
  public static get progress(): number {
    return this._progress;
  }
  public static set progress(v: number) {
    this._progress = v;
  }
  */

  /**
   * Si esta definido oldPixelBlack devuelve el pixel mas cercano a este.
   *
   * @param {ImgToGCode.Image} image
   * @param {ImgToGCode.PixelToMM} _pixel
   * @param {ImgToGCode.Pixel[][]} [oldPixelBlack]
   * @returns {ImgToGCode.Pixel[][]}
   */
  public static getFirstPixel(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM, oldPixelBlack?: ImgToGCode.Pixel[][]): ImgToGCode.Pixel[][] {
    if (oldPixelBlack) {
      return Utilities.nearest(
        oldPixelBlack,
        Utilities.nearest(oldPixelBlack, this.getFirstPixelUpWidth(image, _pixel), this.getFirstPixelBottomWidth(image, _pixel)),
        Utilities.nearest(oldPixelBlack, this.getFirstPixelBottomHeight(image, _pixel), this.getFirstPixelUpHeight(image, _pixel))
      )
      //return this.getFirstPixelUpWidth(image, _pixel);
    } else {
      return this.getFirstPixelUpWidth(image, _pixel);
    }
  }

  private static getFirstPixelUpWidth(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM): ImgToGCode.Pixel[][] {
    try {
      for (let x = 0, xl = image.pixels.length; x < xl; x++) {
        for (let y = 0, yl = image.pixels[x].length; y < yl; y++) {
          let lFor = this.lootFor(image, _pixel, x, y);
          if (lFor) return <ImgToGCode.Pixel[][]>lFor
        }// for
      }// for
    } catch (error) {
      throw new Error('getFirstPixelUpWidth');
    }
  }
  private static getFirstPixelUpHeight(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM): ImgToGCode.Pixel[][] {
    try {
      for (let y = 0; y < image.pixels[y].length - 1; y++) {
        for (let x = 0, xl = image.pixels.length - 1; x < xl; x++) {
          let lFor = this.lootFor(image, _pixel, x, y);
          if (lFor) return <ImgToGCode.Pixel[][]>lFor
        }// for
      }// for
    } catch (error) {
      throw new Error('getFirstPixelUpHeight');
    }
  }
  private static getFirstPixelBottomWidth(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM): ImgToGCode.Pixel[][] {
    try {
      for (let x = image.pixels.length - 1; x >= 0; x--) {
        for (let y = image.pixels[x].length - 1; y >= 0; y--) {
          let lFor = this.lootFor(image, _pixel, x, y);
          if (lFor) return <ImgToGCode.Pixel[][]>lFor
        }// for
      }// for
    } catch (error) {
      throw new Error('getFirstPixelBottomWidth');
    }
  }
  private static getFirstPixelBottomHeight(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM): ImgToGCode.Pixel[][] {
    try {
      for (let y = image.pixels[image.pixels.length - 1].length - 1; y >= 0; y--) {
        for (let x = image.pixels.length - 1; x >= 0; x--) {
          let lFor = this.lootFor(image, _pixel, x, y);
          if (lFor) return <ImgToGCode.Pixel[][]>lFor
        }// for
      }// for
    } catch (error) {
      throw new Error('getFirstPixelBottomHeight');
    }
  }

  private static lootFor(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM, x: number, y: number): ImgToGCode.Pixel[][] | boolean {
    //if (this.progress < x * y) this.progress = x * y;
    let pixels: ImgToGCode.Pixel[][] = [],
      diameter = _pixel.diameter < 1 ? 1 : Math.round(_pixel.diameter),
      diameterX2 = diameter + diameter / 2;
    if (x + diameter <= image.width && y + diameter <= image.height && image.pixels[x][y].intensity < 765) {
      for (let x2 = 0, pd = diameter; x2 < pd; x2++) {
        let row: ImgToGCode.Pixel[] = [];
        for (let countBlack = 0, y2 = 0; y2 < pd; y2++) {
          let p = image.pixels[x + x2 < image.height ? x + x2 : image.height][y + y2 < image.width ? y + y2 : image.width];
          if (p.intensity < 765) {
            if (countBlack > diameterX2 || !p.be) {
              countBlack++;
              row.push(p);
            } //else { countBlack--; }
          }/* else {
            if (countBlack > diameterX2) {
              row.push(p);
            }
          }*/
        }
        pixels.push(row);
      }
      return (Utilities.size(pixels, true) === diameter * diameter) ? pixels : false;
    }
  }

  /**
   * Black pixel under and / or around the tool to directly download.
   * 
   * @static
   * @param {ImgToGCode.Pixel[][]} oldPixelBlack.
   * @param {ImgToGCode.Image} image It is pixel array.
   * @param {ImgToGCode.PixelToMM} _pixel
   * @returns {ImgToGCode.Pixel[][]}
   * 
   * @memberOf Analyze
   */
  public static nextBlackToMove(oldPixelBlack: ImgToGCode.Pixel[][], image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM): ImgToGCode.Pixel[][] {

    let arrLootAt = this.lootAtBlackPixel(oldPixelBlack, image, _pixel.diameter),
      diameter = _pixel.diameter < 1 ? 1 : Math.round(_pixel.diameter),
      diameterX2 = diameter + diameter / 2;
    for (let x = 0, l = arrLootAt.length; x < l; x++) {
      for (let y = 0; y < l; y++) {
        if (arrLootAt[x][y].intensity < 765) {
          let pixels: ImgToGCode.Pixel[][] = [];
          for (let x2 = 0, pd = diameter; x2 < pd; x2++) {
            let row: ImgToGCode.Pixel[] = [];
            for (let y2 = 0, countBlack = 0; y2 < pd; y2++) {
              let p = arrLootAt[x + x2][y + y2];
              if (!p) break;
              if (p.intensity < 765) {
                if (countBlack > diameterX2 || !p.be) {
                  countBlack++;
                  row.push(p);
                } //else { countBlack--; }
              }// else { if (countBlack > diameterX2) {row.push(p);}
              pixels.push(row);
            }
            if ((Utilities.size(pixels, true) === diameter * diameter)) return pixels;
          }
        }
      }// for
    }// for

    return this.getFirstPixel(image, _pixel, oldPixelBlack);
  }

  /**
   * Para obtener pixeles de oldPixelBlack
   * 
   * @static
   * @param {ImgToGCode.Pixel[][]} oldPixelBlack
   * @param {ImgToGCode.Image} image
   * @param {number} diameter
   * @returns {ImgToGCode.Pixel[][]}
   * 
   * @memberOf Analyze
   */
  public static lootAtBlackPixel(oldPixelBlack: ImgToGCode.Pixel[][], image: ImgToGCode.Image, diameter: number): ImgToGCode.Pixel[][] {
    let arr: ImgToGCode.Pixel[][] = [];
    for (let x = 0, xl = oldPixelBlack.length; x < xl; x++) {
      for (let y = 0, yl = oldPixelBlack[x].length; y < yl; y++) {

        for (let x2 = -diameter, d = diameter + diameter; x2 <= d; x2++) {
          let val_x = oldPixelBlack[x][y].axes.x + x2;
          if (val_x < 0 || val_x > image.height) break;
          let row: ImgToGCode.Pixel[] = [];
          for (let y2 = -diameter, d = diameter + diameter; y2 <= d; y2++) {
            let val_y = oldPixelBlack[x][y].axes.y + y2;
            if (val_y < 0 || val_y > image.width) break;
            row.push(image.pixels[val_x][val_y]);
          }
          arr.push(row);
        }

        return arr;
      }// for
    }// for
  }

}// class
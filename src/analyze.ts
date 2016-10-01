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

    console.log( Utilities.centerDistance(this.getFirstPixelUpWidth(image, _pixel)) );
    console.log( Utilities.centerDistance(this.getFirstPixelUpHeight(image, _pixel)) );
    console.log( Utilities.centerDistance(this.getFirstPixelBottomWidth(image, _pixel)) );
    console.log( Utilities.centerDistance(this.getFirstPixelBottomHeight(image, _pixel)) );

    if (oldPixelBlack) {
      return Utilities.nearest(
        oldPixelBlack,
        Utilities.nearest(oldPixelBlack, this.getFirstPixelUpWidth(image, _pixel), this.getFirstPixelBottomHeight(image, _pixel)),
        Utilities.nearest(oldPixelBlack, this.getFirstPixelBottomWidth(image, _pixel), this.getFirstPixelUpHeight(image, _pixel))
      )
    } else {
      return this.getFirstPixelUpWidth(image, _pixel);
    }
  }

  private static getFirstPixelUpWidth(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM): ImgToGCode.Pixel[][] {
    try {
      let diameter = _pixel.diameter < 1 ? 1 : Math.floor(_pixel.diameter);
      for (let x = 0, xl = image.pixels.length; x < xl; x++) {
        for (let y = 0, yl = image.pixels[x].length; y < yl; y++) {
          let lFor = this.lootFor(image, diameter, x, y);
          if (lFor) return <ImgToGCode.Pixel[][]>lFor
        }// for
      }// for
    } catch (error) {
      throw new Error(`getFirstPixelUpWidth\n ${error}`);
    }
  }
  private static getFirstPixelUpHeight(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM): ImgToGCode.Pixel[][] {
    try {
      let diameter = _pixel.diameter < 1 ? 1 : Math.floor(_pixel.diameter);
      for (let y = 0; y < image.pixels[y].length - 1; y++) {
        for (let x = 0, xl = image.pixels.length - 1; x < xl; x++) {
          let lFor = this.lootFor(image, diameter, x, y);
          if (lFor) return <ImgToGCode.Pixel[][]>lFor
        }// for
      }// for
    } catch (error) {
      throw new Error(`getFirstPixelUpHeight\n ${error}`);
    }
  }
  private static getFirstPixelBottomWidth(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM): ImgToGCode.Pixel[][] {
    try {
      let diameter = _pixel.diameter < 1 ? 1 : Math.floor(_pixel.diameter);
      for (let x = image.pixels.length - 1; x >= 0; x--) {
        for (let y = image.pixels[x].length - 1; y >= 0; y--) {
          let lFor = this.lootFor(image, diameter, x, y);
          if (lFor) return <ImgToGCode.Pixel[][]>lFor
        }// for
      }// for
    } catch (error) {
      throw new Error(`getFirstPixelBottomWidth\n ${error}`);
    }
  }
  private static getFirstPixelBottomHeight(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM): ImgToGCode.Pixel[][] {
    try {
      let diameter = _pixel.diameter < 1 ? 1 : Math.floor(_pixel.diameter);
      for (let y = image.pixels[image.pixels.length - 1].length - 1; y >= 0; y--) {
        for (let x = image.pixels.length - 1; x >= 0; x--) {
          let lFor = this.lootFor(image, diameter, x, y);
          if (lFor) return <ImgToGCode.Pixel[][]>lFor
        }// for
      }// for
    } catch (error) {
      throw new Error(`getFirstPixelBottomHeight\n ${error}`);
    }
  }

  private static lootFor(image: ImgToGCode.Image, diameter: number, x: number, y: number): ImgToGCode.Pixel[][] | boolean {
    //if (this.progress < x * y) this.progress = x * y;
    let pixels: ImgToGCode.Pixel[][] = [];
    if (x + diameter <= image.width && y + diameter <= image.height && image.pixels[x][y].intensity < 765) {
      for (let x2 = 0, pd = diameter; x2 < pd; x2++) {
        let row: ImgToGCode.Pixel[] = [];
        for (let y2 = 0; y2 < pd; y2++) {
          let countBlack = 0, p = image.pixels[x + x2 < image.height ? x + x2 : image.height][y + y2 < image.width ? y + y2 : image.width];
          if (p.intensity < 765) {
            countBlack++;
            if (countBlack > diameter || !p.be) { row.push(p); }
            //else { countBlack--; }
          }
        }
        pixels.push(row);
      }
      if (Utilities.size(pixels, true) === diameter * diameter) {
        return pixels;
      } else {
        return false;
      }
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

    function lootAtUp(oldPixelBlack: ImgToGCode.Pixel[][]): ImgToGCode.Pixel[] {
      try {
        let pixels: ImgToGCode.Pixel[] = [];
        for (let iX = 0, l = oldPixelBlack.length; iX < l; iX++) {
          let e = oldPixelBlack[iX][0];
          if (e === undefined || e.axes.y === 0) break;
          let pixel = image.pixels[e.axes.x][e.axes.y - 1];
          if (pixel) pixels.push(pixel);
        }
        return pixels;
      } catch (error) {
        throw new Error(`LootAtUp\n ${error}`);
      }
    }
    function lootAtLeft(oldPixelBlack: ImgToGCode.Pixel[][]): ImgToGCode.Pixel[] {
      try {
        let pixels: ImgToGCode.Pixel[] = [];
        for (let iColumn = 0, l = oldPixelBlack[0].length; iColumn < l; iColumn++) {
          let e = oldPixelBlack[0][iColumn];
          if (e === undefined || e.axes.x === 0) break;
          let pixel = image.pixels[e.axes.x - 1][e.axes.y];
          if (pixel) pixels.push(pixel);
        }
        return pixels;
      } catch (error) {
        throw new Error(`LootAtUp\n ${error}`);
      }
    }
    function lootAtDown(oldPixelBlack: ImgToGCode.Pixel[][]): ImgToGCode.Pixel[] {
      try {
        let pixels: ImgToGCode.Pixel[] = [];
        for (let iY = 0, l = oldPixelBlack[0].length; iY < l; iY++) {
          let e = oldPixelBlack[iY][l - 1];
          if (e === undefined || e.axes.y === image.width - 1) break;
          let pixel = image.pixels[e.axes.x][e.axes.y + 1];
          if (pixel) pixels.push(pixel);
        }
        return pixels;
      } catch (error) {
        throw new Error(`LootAtDown\n ${error}`);
      }
    }
    function lootAtRight(oldPixelBlack: ImgToGCode.Pixel[][]): ImgToGCode.Pixel[] {
      try {
        let pixels: ImgToGCode.Pixel[] = [];
        for (let iRow = 0, l = oldPixelBlack[oldPixelBlack.length - 1]; iRow < l.length; iRow++) {
          let e = l[iRow];
          if (e === undefined || e.axes.x === image.height - 1) break;
          let pixel = image.pixels[e.axes.x + 1][e.axes.y];
          if (pixel) pixels.push(pixel);
        }
        return pixels;
      } catch (error) {
        throw new Error(`LootAtRight\n ${error}`);
      }
    }

    try {
      // sortear por donde empezar ?¿?¿?¿
      let arrPixel: ImgToGCode.Pixel[][] = [];
      let PLootAtUp = lootAtUp(oldPixelBlack); // up
      let PLootAtLeft = lootAtLeft(oldPixelBlack); // left (<-o)
      let PLootAtRight = lootAtRight(oldPixelBlack); // right (o->)
      let PLootAtDown = lootAtDown(oldPixelBlack); // down

      // sortear por donde empezar ?¿?¿?¿
      if (Utilities.allBlack(PLootAtUp, _pixel.diameter)) {
        for (let iRow = 0, l = oldPixelBlack.length; iRow < l; iRow++) {
          let row: ImgToGCode.Pixel[] = [];
          row.push(PLootAtUp[iRow]);
          for (let iColumn = 0, l2 = oldPixelBlack[iRow].length; iColumn < l2 - 1; iColumn++) {
            row.push(oldPixelBlack[iRow][iColumn]);
          }
          arrPixel.push(row);
        }

      } else if (Utilities.allBlack(PLootAtLeft, _pixel.diameter)) {
        arrPixel.push(PLootAtLeft);
        for (let iRow = oldPixelBlack.length - 1; iRow > 0; iRow--) {
          let e = oldPixelBlack[iRow];
          arrPixel.push(e);
        }

      } else if (Utilities.allBlack(PLootAtRight, _pixel.diameter)) {
        for (let iRow = 1, l = oldPixelBlack.length; iRow < l; iRow++) {
          arrPixel.push(oldPixelBlack[iRow]);
        }
        arrPixel.push(PLootAtRight);

      } else if (Utilities.allBlack(PLootAtDown, _pixel.diameter)) {
        for (let iRow = 0, l = oldPixelBlack.length; iRow < l; iRow++) {
          let row: ImgToGCode.Pixel[] = [];
          for (let iColumn = 1, l2 = oldPixelBlack[iRow].length; iColumn < l2; iColumn++) {
            row.push(oldPixelBlack[iRow][iColumn]);
          }
          row.push(PLootAtDown[iRow]);
          arrPixel.push(row);
        }

      } else {
        arrPixel = this.getFirstPixel(image, _pixel, oldPixelBlack);
      }

      return arrPixel;

    } catch (error) {
      throw new Error(`NextBlackToMove\n ${error}`);
    }
  }

}// class
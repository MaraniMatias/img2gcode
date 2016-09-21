import Utilities from "./utilities";
export default class Analyze {

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
      return Utilities.nearest(oldPixelBlack, this.getFirstPixelWidth(image, _pixel), this.getFirstPixelHeight(image, _pixel))
    } else {
      return this.getFirstPixelWidth(image, _pixel);
    }
  }

  /**
   * Black pixel below the tool to directly download.
   * Width -> Y
   * @returns {Pixel[][]}
   */
  private static getFirstPixelWidth(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM): ImgToGCode.Pixel[][] {
    try {
      for (let x = 0; x < image.pixels.length; x++) {
        for (let y = 0; y < image.pixels[x].length; y++) {
          let pixels: ImgToGCode.Pixel[][] = [],
            diameter = _pixel.diameter < 1 ? 1 : Math.floor(_pixel.diameter);
          if (x + _pixel.diameter <= image.width && y + _pixel.diameter <= image.height && image.pixels[x][y].intensity < 765) {
            for (let x2 = 0; x2 < _pixel.diameter; x2++) {
              let row: ImgToGCode.Pixel[] = [];
              for (let y2 = 0; y2 < _pixel.diameter; y2++) {
                let countBlack = 0, p = image.pixels[x + x2 < image.height ? x + x2 : image.height][y + y2 < image.width ? y + y2 : image.width];
                if (p.intensity < 765) {
                  countBlack++;
                  if (countBlack > diameter || !p.be) { row.push(p); }
                  //else { countBlack--; }
                }
              }
              pixels.push(row);
            }
            if (pixels[0].length === diameter && pixels[pixels.length - 1].length === diameter) {
              return pixels;
            }
          }
        }// for
      }// for
    } catch (error) {
      throw new Error(`GetFirstPixelWidth\n ${error}`);
    }
  }
  /**
   * Black pixel below the tool to directly download.
   * Height -> X
   * @returns {Pixel[][]}
   */
  private static getFirstPixelHeight(image: ImgToGCode.Image, _pixel: ImgToGCode.PixelToMM): ImgToGCode.Pixel[][] {
    try {
      for (let x = 0; x < image.pixels[x].length - 1; x++) {
        for (let y = 0; y < image.pixels.length - 1; y++) {
          let pixels: ImgToGCode.Pixel[][] = [],
            diameter = _pixel.diameter < 1 ? 1 : Math.floor(_pixel.diameter);
          if (x + _pixel.diameter <= image.width && y + _pixel.diameter <= image.height && image.pixels[x][y].intensity < 765) {
            for (let x2 = 0; x2 < _pixel.diameter; x2++) {
              let row: ImgToGCode.Pixel[] = [];
              for (let y2 = 0; y2 < _pixel.diameter; y2++) {
                let countBlack = 0, p = image.pixels[x + x2 < image.height ? x + x2 : image.height][y + y2 < image.width ? y + y2 : image.width];
                if (p.intensity < 765) {
                  countBlack++;
                  if (countBlack > diameter || !p.be) { row.push(p); }
                  //else { countBlack--; }
                }
              }
              pixels.push(row);
            }
            if (pixels[0].length === diameter && pixels[pixels.length - 1].length === diameter) {
              return pixels;
            }
          }
        }// for
      }// for
    } catch (error) {
      throw new Error(`GetFirstPixelHeight\n ${error}`);
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
        for (let iX = 0; iX < oldPixelBlack.length; iX++) {
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
        for (let iColumn = 0; iColumn < oldPixelBlack[0].length; iColumn++) {
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
        for (let iY = 0; iY < oldPixelBlack[0].length; iY++) {
          let e = oldPixelBlack[iY][oldPixelBlack[0].length - 1];
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
        for (let iRow = 0; iRow < oldPixelBlack[oldPixelBlack.length - 1].length; iRow++) {
          let e = oldPixelBlack[oldPixelBlack.length - 1][iRow];
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
        for (let iRow = 0; iRow < oldPixelBlack.length; iRow++) {
          let row: ImgToGCode.Pixel[] = [];
          row.push(PLootAtUp[iRow]);
          for (let iColumn = 0; iColumn < oldPixelBlack[iRow].length - 1; iColumn++) {
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
        for (let iRow = 1; iRow < oldPixelBlack.length; iRow++) {
          let e = oldPixelBlack[iRow];
          arrPixel.push(e);
        }
        arrPixel.push(PLootAtRight);

      } else if (Utilities.allBlack(PLootAtDown, _pixel.diameter)) {
        for (let iRow = 0; iRow < oldPixelBlack.length; iRow++) {
          let row: ImgToGCode.Pixel[] = [];
          for (let iColumn = 1; iColumn < oldPixelBlack[iRow].length; iColumn++) {
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
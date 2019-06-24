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
  public static getFirstPixel(
    image: ImgToGCode.Image,
    _pixel: ImgToGCode.PixelToMM,
    oldPixelBlack?: ImgToGCode.Pixel[][]
  ): ImgToGCode.Pixel[][] {
    try {
      if (oldPixelBlack) {
        return Utilities.nearest(
          oldPixelBlack,
          Utilities.nearest(
            oldPixelBlack,
            this.getFirstPixelUpWidth(image, _pixel),
            this.getFirstPixelBottomWidth(image, _pixel)
          ),
          Utilities.nearest(
            oldPixelBlack,
            this.getFirstPixelBottomHeight(image, _pixel),
            this.getFirstPixelUpHeight(image, _pixel)
          )
        );
      } else {
        return this.getFirstPixelUpWidth(image, _pixel);
      }
    } catch (error) {
      throw new Error(
        "Something went wrong :(. \nPlease try other measures to 'tool Diameter' or 'scaleAxes'."
      );
    }
  }

  private static getFirstPixelUpWidth(
    image: ImgToGCode.Image,
    _pixel: ImgToGCode.PixelToMM
  ): ImgToGCode.Pixel[][] {
    for (let x = 0, xl = image.pixels.length; x < xl; x++) {
      for (let y = 0, yl = image.pixels[x].length; y < yl; y++) {
        let lFor = this.lookFor(image, _pixel, x, y);
        if (lFor) return <ImgToGCode.Pixel[][]>lFor;
      }
    }
  }
  private static getFirstPixelUpHeight(
    image: ImgToGCode.Image,
    _pixel: ImgToGCode.PixelToMM
  ): ImgToGCode.Pixel[][] {
    for (let y = 0; y < image.pixels[y].length - 1; y++) {
      for (let x = 0, xl = image.pixels.length - 1; x < xl; x++) {
        let lFor = this.lookFor(image, _pixel, x, y);
        if (lFor) return <ImgToGCode.Pixel[][]>lFor;
      }
    }
  }
  private static getFirstPixelBottomWidth(
    image: ImgToGCode.Image,
    _pixel: ImgToGCode.PixelToMM
  ): ImgToGCode.Pixel[][] {
    for (let x = image.pixels.length - 1; x >= 0; x--) {
      for (let y = image.pixels[x].length - 1; y >= 0; y--) {
        let lFor = this.lookFor(image, _pixel, x, y);
        if (lFor) return <ImgToGCode.Pixel[][]>lFor;
      }
    }
  }
  private static getFirstPixelBottomHeight(
    image: ImgToGCode.Image,
    _pixel: ImgToGCode.PixelToMM
  ): ImgToGCode.Pixel[][] {
    for (let y = image.pixels[image.pixels.length - 1].length - 1; y >= 0; y--) {
      for (let x = image.pixels.length - 1; x >= 0; x--) {
        let lFor = this.lookFor(image, _pixel, x, y);
        if (lFor) return <ImgToGCode.Pixel[][]>lFor;
      }
    }
  }

  private static lookFor(
    image: ImgToGCode.Image,
    _pixel: ImgToGCode.PixelToMM,
    x: number,
    y: number
  ): ImgToGCode.Pixel[][] | boolean {
    let pixels: ImgToGCode.Pixel[][] = [],
      diameter = _pixel.diameter < 1 ? 1 : Math.round(_pixel.diameter),
      diameterX2 = diameter + diameter / 2;
    if (
      x + diameter <= image.width &&
      y + diameter <= image.height &&
      image.pixels[x][y].intensity < 765
    ) {
      for (let x2 = 0, pd = diameter; x2 < pd; x2++) {
        let row: ImgToGCode.Pixel[] = [];
        for (let countBlack = 0, y2 = 0; y2 < pd; y2++) {
          let p =
            image.pixels[x + x2 < image.height ? x + x2 : image.height][
              y + y2 < image.width ? y + y2 : image.width
            ];
          if (p.intensity < 765) {
            if (countBlack > diameterX2 || !p.be) {
              countBlack++;
              row.push(p);
            } //else { countBlack--; }
          }
          /* else {
                        if (countBlack > diameterX2) {
                        row.push(p);
                        }
                        }*/
        }
        pixels.push(row);
      }
      return Utilities.size(pixels, true) === diameter * diameter ? pixels : false;
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
  public static nextBlackToMove(
    oldPixelBlack: ImgToGCode.Pixel[][],
    image: ImgToGCode.Image,
    _pixel: ImgToGCode.PixelToMM
  ): ImgToGCode.Pixel[][] {
    let arrLootAt = this.lootAtBlackPixel(oldPixelBlack, image, _pixel.diameter);
    let diameter = _pixel.diameter < 1 ? 1 : Math.round(_pixel.diameter);
    ///let  diameterX2 = diameter + diameter / 2;

    for (let x = 0, l = arrLootAt.length - 1; x < l; x++) {
      for (let y = 0; y < l; y++) {
        if (arrLootAt[x][y] && arrLootAt[x][y].intensity < 765) {
          // encontre el primer pixel negro , ahora buscar pixeles debajo de la brocha.
          let pixelBir: ImgToGCode.Pixel[][] = [];
          for (let x2 = 0; x2 < diameter; x2++) {
            let rowBit: ImgToGCode.Pixel[] = [];
            for (let y2 = 0; y2 < diameter; y2++) {
              // si no es negro o lo quequiero para y buscar más adelante.
              if (x + x2 <= l && y + y2 <= l) {
                let p = arrLootAt[x + x2][y + y2];
                if (!p || p.intensity === 765 || p.be) {
                  x2 = diameter;
                  y2 = diameter;
                  break;
                } else {
                  rowBit.push(p);
                }
              }
            } // for
            pixelBir.push(rowBit);
          } // for
          if (Utilities.size(pixelBir, true) === diameter * diameter) {
            return pixelBir;
          }
        }
      } // for
    } // for
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
  public static lootAtBlackPixel(
    oldPixelBlack: ImgToGCode.Pixel[][],
    image: ImgToGCode.Image,
    diameter: number
  ): ImgToGCode.Pixel[][] {
    try {
      let arr: ImgToGCode.Pixel[][] = [];
      for (let x = 0, xl = oldPixelBlack.length; x < xl; x++) {
        for (let y = 0, yl = oldPixelBlack[x].length; y < yl; y++) {
          for (let x2 = -diameter, d = diameter + diameter; x2 <= d; x2++) {
            let val_x = Math.floor(oldPixelBlack[x][y].x + x2);
            let row: ImgToGCode.Pixel[] = [];
            for (let y2 = -diameter, d = diameter + diameter; y2 <= d; y2++) {
              let val_y = Math.floor(oldPixelBlack[x][y].y + y2);
              if (val_x < 0 || val_x >= image.height || val_y < 0 || val_y >= image.width) {
                row.push(void 0);
              } else {
                row.push(image.pixels[val_x][val_y]);
              }
            }
            arr.push(row);
          }

          return arr;
        } // for
      } // for
    } catch (error) {
      throw new Error(
        "Something went wrong :(. \nPlease try other measures to 'tool Diameter' or 'scaleAxes'."
      );
    }
  }
} // class

export default class Utilities {
  /**
   * Round(15.8877) => 15.88
   * @param {number} num
   * @returns {number}
   */
  public static round(num: number): number {
    return Math.round(num * 100) / 100;
  }

  /**
   * Count the black pixel.
   * @param {Array} arr
   * @returns {number} size of array
   */
  public static size(arr: ImgToGCode.Pixel[][], all?: boolean): number {
    try {
      let size = 0;
      for (let x = 0, xl = arr.length; x < xl; x++) {
        for (let y = 0, yl = arr[x].length; y < yl; y++) {
          if (all) size++;
          else if (arr[x][y].intensity < 765 && !arr[x][y].be) size++;
        }
      }
      return size
    } catch (error) {
      throw new Error(`Size ${arr.length * arr[arr.length - 1].length}\n ${error}`);
    }
  }

  public static pixelEnds(newPixel: ImgToGCode.Pixel[][]): ImgToGCode.Pixel[] {
    try {
      let arrNewPixel: ImgToGCode.Pixel[] = [];
      arrNewPixel.push(newPixel[0][0]);
      arrNewPixel.push(newPixel[0][newPixel[newPixel.length - 1].length - 1]);
      arrNewPixel.push(newPixel[newPixel.length - 1][0]);
      arrNewPixel.push(newPixel[newPixel.length - 1][newPixel[newPixel.length - 1].length - 1]);

console.log(
  newPixel[newPixel.length - 1][newPixel[newPixel.length - 1].length - 1].axes.x
  , 'mx', newPixel[0][0].axes.x
  , (newPixel[0][newPixel[newPixel.length - 1].length - 1].axes.x - newPixel[0][0].axes.x) / 2
  , ';',
  newPixel[newPixel.length - 1][newPixel[newPixel.length - 1].length - 1].axes.y
  , 'my', newPixel[0][0].axes.y
  , (newPixel[0][newPixel[newPixel.length - 1].length - 1].axes.y - newPixel[0][0].axes.y) / 2
);

      return arrNewPixel
    } catch (error) {
      throw error;
    }
  }

  public static distanceIsOne(oldPixel: ImgToGCode.Pixel[][], newPixel: ImgToGCode.Pixel[][]): boolean {
    try {
/*
            let sum = this._pixel.diameter / 2;
            let X = axes.x && (axes.x + sum) * this._pixel.toMm;
            let Y = axes.y && (axes.y + sum) * this._pixel.toMm;

            let diameter = oldPixel.length / 2;
            let oldPixelDis = {
              x:
              y:
            };
            let newPixelDis = {
              x:
              y:
            };
*/

      // tener ecuenta el paso ??
      // diameter tener encuenta ???
      let arrNewPixel = this.pixelEnds(newPixel), arrOldPixel = this.pixelEnds(oldPixel);
      for (let ix = 0, xl = arrNewPixel.length; ix < xl; ix++) {
        for (let iy = 0, yl = arrOldPixel.length; iy < yl; iy++) {
          let disX = arrNewPixel[ix].axes.x - arrOldPixel[iy].axes.x;
          let disY = arrNewPixel[ix].axes.y - arrOldPixel[iy].axes.y;
          return (disY === 1 && disX === 1) || (disY === 1 && disX === -1) ||
            (disY === -1 && disX === 1) || (disY === -1 && disX === -1) ||
            (disY === 0 && disX === 1) || (disX === 0 && disY === 1) ||
            (disY === 0 && disX === -1) || (disX === 0 && disY === -1) ||
            (disX === 0 && disY === 0)
        }
      }

    } catch (error) {
      throw new Error(`DistanceIsOne\n ${error}`);
    }
  }

  public static appliedAllPixel(arr: ImgToGCode.Pixel[][], cb: (pixel: ImgToGCode.Pixel, iRow: number, iColumn?: number) => void) {
    try {
      for (let iRow = 0, rl = arr.length; iRow < rl; iRow++) {
        if (arr[iRow].length === 1) {
          cb(arr[iRow][0], iRow);
        }
        for (let iColumn = 0, cl = arr[iRow].length - 1; iColumn < cl; iColumn++) {
          cb(arr[iRow][iColumn], iRow, iColumn);
        }
      }
    } catch (error) {
      throw new Error(`AppliedAllPixel\n ${error}`);
    }
  }

  /**
   * Tengo encuenta que si hay más pixel negros que blancos.
   * 
   * @param {Pixel[]} oldPixelBlack
   * @param {number} pixelDiameter tamaño de la herramienta en pixel.
   * @returns {boolean}
   */
  public static allBlack(oldPixelBlack: ImgToGCode.Pixel[], pixelDiameter: number): boolean {
    try {
      let countBlack = 0;
      if (oldPixelBlack.length !== pixelDiameter) { return false; }
      if (oldPixelBlack[0] === undefined) return false;
      for (let x = 0, l = oldPixelBlack.length; x < l; x++) {
        if (oldPixelBlack[x].be) {
          return false;
        }
      }
      return true;
    } catch (error) {
      throw new Error(`AllBlack\n ${error}`);
    }
  }

  public static nearest(oldPixel: ImgToGCode.Pixel[][], newPixel1: ImgToGCode.Pixel[][], newPixel2: ImgToGCode.Pixel[][]): ImgToGCode.Pixel[][] {
    try {
      if (!newPixel2) return newPixel1;
      let arrPixel1 = this.pixelEnds(newPixel1);
      let arrPixel2 = this.pixelEnds(newPixel2);
      let arrOldPixel = this.pixelEnds(oldPixel);

      function nearestPoint(oldArr: ImgToGCode.Pixel[], newArr: ImgToGCode.Pixel[]): number {
        let nearest = null;
        for (let ix = 0, xl = arrPixel1.length; ix < xl; ix++) {
          for (let iy = 0, yl = arrOldPixel.length; iy < yl; iy++) {
            let disX = arrPixel1[ix].axes.x - arrOldPixel[iy].axes.x;
            let disY = arrPixel1[ix].axes.y - arrOldPixel[iy].axes.y;
            let dis = disX * (disX > 0 ? 1 : -1) + disY * (disY > 0 ? 1 : -1);
            if (nearest === null || nearest > dis) nearest = dis;
          }
        }
        return nearest
      }

      return nearestPoint(arrOldPixel, arrPixel1) < nearestPoint(arrOldPixel, arrPixel2) ? newPixel1 : newPixel2
    } catch (error) {
      throw new Error(`Nearest\n ${error}`);
    }
  }

  public static resolveZ(pixels: ImgToGCode.Pixel[][], whiteZ: number, blackZ: number): number {
    function avgIntensity(): number {
      let l = pixels.length, intensity = 0;
      for (let r = 0; r < l; r++) {
        for (let c = 0; c < l; c++) {
          intensity = pixels[r][c].intensity;
        }
      }
      return intensity / (l * l);
    }
    return -((avgIntensity() * blackZ / 765) - blackZ)
  }
}// class
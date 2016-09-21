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
  public static size(arr: ImgToGCode.Pixel[][]): number {
    try {
      let size = 0;
      for (let x = 0; x < arr.length; x++) {
        for (let y = 0; y < arr[x].length; y++) {
          if (arr[x][y].intensity < 765 && !arr[x][y].be) size++;
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
      arrNewPixel.push(newPixel[newPixel.length - 1][newPixel[newPixel.length - 1].length - 1]);
      arrNewPixel.push(newPixel[0][0]);
      arrNewPixel.push(newPixel[0][newPixel[newPixel.length - 1].length - 1]);
      arrNewPixel.push(newPixel[newPixel.length - 1][0]);
      return arrNewPixel
    } catch (error) {
      throw error;
    }

  }

  public static distanceIsOne(oldPixel: ImgToGCode.Pixel[][], newPixel: ImgToGCode.Pixel[][]): boolean {
    try {
      // tener ecuenta el paso ??
      // diameter tener encuenta ???
      let arrNewPixel = this.pixelEnds(newPixel), arrOldPixel = this.pixelEnds(oldPixel);
      for (let ix = 0; ix < arrNewPixel.length; ix++) {
        for (let iy = 0; iy < arrOldPixel.length; iy++) {
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
      for (let iRow = 0; iRow < arr.length; iRow++) {
        if (arr[iRow].length === 1) {
          cb(arr[iRow][0], iRow);
        }
        for (let iColumn = 0; iColumn < arr[iRow].length - 1; iColumn++) {
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
      if (oldPixelBlack[0] === undefined) return false;
      for (let x = 0; x < oldPixelBlack.length; x++) {
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
      for (let ix = 0; ix < arrPixel1.length; ix++) {
        for (let iy = 0; iy < arrOldPixel.length; iy++) {
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

}// class
/**
 * Round(15.8877) => 15.88
 * 
 * @param {number} num
 * @returns {number}
 */
function round(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * @param {Array} arr
 * @returns {number} size of array
 */
function size(arr: imgToCode.Pixel[][]): number {
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

function pixelEnds(newPixel: imgToCode.Pixel[][]): imgToCode.Pixel[] {
  let arrNewPixel: imgToCode.Pixel[] = [];
  arrNewPixel.push(newPixel[newPixel.length - 1][newPixel[newPixel.length - 1].length - 1]);
  arrNewPixel.push(newPixel[0][0]);
  arrNewPixel.push(newPixel[0][newPixel[newPixel.length - 1].length - 1]);
  arrNewPixel.push(newPixel[newPixel.length - 1][0]);
  return arrNewPixel
}

function distanceIsOne(oldPixel: imgToCode.Pixel[][], newPixel: imgToCode.Pixel[][]): boolean {
  try {
    // tener ecuenta el paso ??
    // diameter tener encuenta ???
    let arrNewPixel = pixelEnds(newPixel);
    let arrOldPixel = pixelEnds(oldPixel);

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

function appliedAllPixel(arr: imgToCode.Pixel[][], cb: (pixel: imgToCode.Pixel, iRow: number, iColumn?: number) => void) {
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
 * Pensar con los paso y capas que si es negro pero deveser procesado
 * 
 * @param {Pixel[]} oldPixelBlack
 * @returns {boolean}
 */
function allBlack(oldPixelBlack: imgToCode.Pixel[]): boolean {
  try {
    if (oldPixelBlack[0] === undefined) return false;
    for (let x = 0; x < oldPixelBlack.length; x++) {
      if (oldPixelBlack[x].intensity > 10 || oldPixelBlack[x].be) {
        return false;
      }
    }
    return true;
  } catch (error) {
    throw new Error(`AllBlack\n ${error}`);
  }
}

function nearest(oldPixel: imgToCode.Pixel[][], newPixel1: imgToCode.Pixel[][], newPixel2: imgToCode.Pixel[][]): imgToCode.Pixel[][] {
  try {
    if (!newPixel2) return newPixel1;

    let arrPixel1 = pixelEnds(newPixel1);
    let arrPixel2 = pixelEnds(newPixel2);
    let arrOldPixel = pixelEnds(oldPixel);

    function nearestPoint(oldArr: imgToCode.Pixel[], newArr: imgToCode.Pixel[]): number {
      let nearest = null;
      for (let ix = 0; ix < arrPixel1.length; ix++) {
        for (let iy = 0; iy < arrOldPixel.length; iy++) {
          let disX = arrPixel1[ix].axes.x - arrOldPixel[iy].axes.x;
          let disY = arrPixel1[ix].axes.y - arrOldPixel[iy].axes.y;
          let dis = disX * (disX > 0 ? 1 : -1) + disY * (disY > 0 ? 1 : -1);
          if (nearest === null || nearest > dis) nearest = dis;
        }
      }
      return  nearest
    }

    return nearestPoint(arrOldPixel,arrPixel1) > nearestPoint(arrOldPixel,arrPixel2) ? newPixel1:newPixel2

  } catch (error) {
    throw new Error(`Nearest\n ${error}`);
  }
}


export default {
  size, round, nearest,
  allBlack, appliedAllPixel,
  distanceIsOne
}
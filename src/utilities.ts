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


function distanceIsOne(oldPixel:imgToCode.Pixel[][], newPixel:imgToCode.Pixel[][]): boolean{
  try {
    // tener ecuenta el paso ??
    // diameter tener encuenta ???
    let arrNewPixel: Array<imgToCode.Pixel> = Array();
    arrNewPixel.push(newPixel[newPixel.length - 1][newPixel[newPixel.length - 1].length - 1]);
    arrNewPixel.push(newPixel[0][0]);
    arrNewPixel.push(newPixel[0][newPixel[newPixel.length - 1].length - 1]);
    arrNewPixel.push(newPixel[newPixel.length - 1][0]);

    let arrOldPixel: Array<imgToCode.Pixel> = Array();
    arrOldPixel.push(oldPixel[oldPixel.length - 1][oldPixel[oldPixel.length - 1].length - 1]);
    arrOldPixel.push(oldPixel[0][0]);
    arrOldPixel.push(oldPixel[0][oldPixel[oldPixel.length - 1].length - 1]);
    arrOldPixel.push(oldPixel[oldPixel.length - 1][0]);

    for (let ix = 0; ix < arrNewPixel.length; ix++) {
      let nPixel = arrNewPixel[ix];
      for (let iy = 0; iy < arrOldPixel.length; iy++) {
        let oPixel = arrOldPixel[iy];
        let disX = nPixel.axes.x - oPixel.axes.x;
        let disY = nPixel.axes.y - oPixel.axes.y;
        let sigX = 0; sigX = disX > 0 ? 1 : -1;
        let sigY = 0; sigY = disY > 0 ? 1 : -1;

/*if(  ((disY === 1 && disX === 1) ||(disY === -1 && disX === -1) ||
  (disY === 1 && disX === -1) ||(disY === -1 && disX === 1) ||
  (disY === 0 && disX === 1) ||(disX === 0 && disY === 1) ||
  (disY === 0 && disX === -1) ||(disX === 0 && disY === -1) ||
  (disX === 0 && disY === 0)) ){
  console.log(_pixel.diameter,oPixel.axes, nPixel.axes,"disX", disX, "disY", disY, "sigX", sigX, "sigY", sigX,"dis 1, true");
}*/

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

function appliedAllPixel(arr: imgToCode.Pixel[][], cb:( pixel: imgToCode.Pixel, iRow:number, iColumn?:number)=>void) {
  try{
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
function allBlack(oldPixelBlack: imgToCode.Pixel[]): boolean{
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

export default {
  size, round,
  allBlack, appliedAllPixel,
  distanceIsOne
}
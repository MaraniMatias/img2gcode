// 0 X width
// Y height
import Utilities from "./utilities";

/**
 * Si esta definido oldPixelBlack devuelve el pixel mas cercano a este.
 * 
 * @param {imgToCode.Image} image
 * @param {imgToCode.PixelToMM} _pixel
 * @param {imgToCode.Pixel[][]} [oldPixelBlack]
 * @returns {imgToCode.Pixel[][]}
 */
function getFirstPixel(image: imgToCode.Image, _pixel: imgToCode.PixelToMM, oldPixelBlack?: imgToCode.Pixel[][]): imgToCode.Pixel[][] {
  if (oldPixelBlack) {
    //return getFirstPixelWidth(image, _pixel);
    //return getFirstPixelHeight(image, _pixel);
    return Utilities.nearest(oldPixelBlack, getFirstPixelWidth(image, _pixel),getFirstPixelHeight(image, _pixel))
  } else {
    return getFirstPixelWidth(image, _pixel);
    //return getFirstPixelHeight(image, _pixel);
  }
}

/**
 * pixel negros debajo la her para bajar directamente
 * Width => Y
 * @returns {Pixel[][]}
 */
function getFirstPixelWidth(image: imgToCode.Image, _pixel: imgToCode.PixelToMM): imgToCode.Pixel[][] {
  try {
 for (let x = 0; x < image.pixels.length; x++) {
  for (let y = 0; y < image.pixels[x].length; y++) {
    let pixels:imgToCode.Pixel[][] = [],
      diameter = _pixel.diameter < 1 ? 1 : Math.floor(_pixel.diameter);
    if (x + _pixel.diameter <= image.width && y + _pixel.diameter <= image.height && image.pixels[x][y].intensity < 765) {
      for (let x2 = 0; x2 < _pixel.diameter; x2++) {
        let row:imgToCode.Pixel[] = [];
        for (let y2 = 0; y2 < _pixel.diameter; y2++) {
          let countBlack = 0, p = image.pixels[x + x2 < image.height ? x + x2 : image.height][y + y2 < image.width ? y + y2 : image.width];
          if (p.intensity < 765) {
            countBlack++;
            if ( /*countBlack > diameter ||*/ !p.be){
              row.push(p);
            }
          }
        }
        pixels.push(row);
      }
      if ( pixels[0].length === diameter && pixels[pixels.length-1].length === diameter) {
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
 * pixel negros debajo la her para bajar directamente
 * Height => X
 * @returns {Pixel[][]}
 */
function getFirstPixelHeight(image: imgToCode.Image, _pixel: imgToCode.PixelToMM): imgToCode.Pixel[][] {
  try {
    for (let iRow = 0; iRow < image.pixels[iRow].length - 1; iRow++) {
      for (let iColumn = 0; iColumn < image.pixels.length - 1; iColumn++) {
        let pixels: imgToCode.Pixel[][] = [],
          diameter = _pixel.diameter < 1 ? 1 : Math.floor(_pixel.diameter);
        if (iRow + _pixel.diameter <= image.width && iColumn + _pixel.diameter <= image.height && image.pixels[iRow][iColumn].intensity < 765) {
          for (let x2 = 0; x2 < _pixel.diameter; x2++) {
            let row: imgToCode.Pixel[] = [];
            for (let y2 = 0; y2 < _pixel.diameter; y2++) {
              let countBlack = 0, p = image.pixels[iRow + x2 < image.height ? iRow + x2 : image.height][iColumn + y2 < image.width ? iColumn + y2 : image.width];
              if (p.intensity < 765) {
                countBlack++;
                if ( /*countBlack > diameter ||*/ !p.be) {
                  row.push(p);
                }
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
 * determinar los pixel negro a corre segun la herr.
 * 
 * @param {Pixel[][]} oldPixelBlack
 */
function nextBlackToMove(oldPixelBlack: imgToCode.Pixel[][], image: imgToCode.Image, _pixel: imgToCode.PixelToMM): imgToCode.Pixel[][] {

  function lootAtUp(oldPixelBlack: imgToCode.Pixel[][]): imgToCode.Pixel[] {
    try {
      let pixels: imgToCode.Pixel[] = [];
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
  function lootAtLeft(oldPixelBlack: imgToCode.Pixel[][]): imgToCode.Pixel[] {
    try {
      let pixels: imgToCode.Pixel[] = [];
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
  function lootAtDown(oldPixelBlack: imgToCode.Pixel[][]): imgToCode.Pixel[] {
    try {
      let pixels: imgToCode.Pixel[] = [];
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
  function lootAtRight(oldPixelBlack: imgToCode.Pixel[][]): imgToCode.Pixel[] {
    try {
      let pixels: imgToCode.Pixel[] = [];
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
    let arrPixel: imgToCode.Pixel[][] = [];
    let PLootAtUp = lootAtUp(oldPixelBlack); // up
    let PLootAtLeft = lootAtLeft(oldPixelBlack); // left (<-o)
    let PLootAtRight = lootAtRight(oldPixelBlack); // right (o->)
    let PLootAtDown = lootAtDown(oldPixelBlack); // down

    // sortear por donde empezar ?¿?¿?¿
    if (Utilities.allBlack(PLootAtUp)) {
      for (let iRow = 0; iRow < oldPixelBlack.length; iRow++) {
        let row: imgToCode.Pixel[] = [];
        row.push(PLootAtUp[iRow]);
        for (let iColumn = 0; iColumn < oldPixelBlack[iRow].length - 1; iColumn++) {
          row.push(oldPixelBlack[iRow][iColumn]);
        }
        arrPixel.push(row);
      }

    } else if (Utilities.allBlack(PLootAtLeft)) {
      arrPixel.push(PLootAtLeft);
      for (let iRow = oldPixelBlack.length - 1; iRow > 0; iRow--) {
        let e = oldPixelBlack[iRow];
        arrPixel.push(e);
      }

    } else if (Utilities.allBlack(PLootAtRight)) {
      for (let iRow = 1; iRow < oldPixelBlack.length; iRow++) {
        let e = oldPixelBlack[iRow];
        arrPixel.push(e);
      }
      arrPixel.push(PLootAtRight);

    } else if (Utilities.allBlack(PLootAtDown)) {
      for (let iRow = 0; iRow < oldPixelBlack.length; iRow++) {
        let row: imgToCode.Pixel[] = [];
        for (let iColumn = 1; iColumn < oldPixelBlack[iRow].length; iColumn++) {
          row.push(oldPixelBlack[iRow][iColumn]);
        }
        row.push(PLootAtDown[iRow]);
        arrPixel.push(row);
      }

    } else {
      arrPixel = getFirstPixel(image, _pixel, oldPixelBlack);
    }

    return arrPixel;


  } catch (error) {
    throw new Error(`NextBlackToMove\n ${error}`);
  }
}

export default {
  getFirstPixel,
  nextBlackToMove
}
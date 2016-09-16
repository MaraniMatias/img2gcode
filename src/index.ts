import Line from "./line";
import File from "./file";
import * as lwip  from 'lwip';
// 0 X width
// Y height
var  
  _gCode: imgToCode.Line[] = [],
  _height: number = 0,
  _width: number = 0,
  _img: imgToCode.Pixel[][] = [],
  _pixel = {
    toMm: 1, // 1 pixel es X mm
    diameter: 1
  }

/**
 * It is mm
 *@param {
 *  toolDiameter: 2,
 *  scaleAxes: 40,
 *  deepStep: -1,
 *  whiteZ: 0,
 *  blackZ: -2,
 *  sevaZ: 2,
 *  dirImg:'./img/test.png',
 *  imgSize:''
 *} It is mm
 */
function start(config: imgToCode.config): Promise<{ data: imgToCode.startPromise }>{
  return new Promise(function (fulfill, reject) {
    try {
      console.log("-> Imagen: ", config.dirImg);//, "\nconfig:", config);
      let self = this;
      return new Promise(function (fulfill, reject) {
        lwip.open(config.dirImg, function (err: Error, image) {
          if (err) throw new Error(err.message);
          _height = image.height();
          _width = image.width();
          _img = getAllPixel(image);

          _pixel.toMm = round(config.scaleAxes / _height);
          _pixel.diameter = round(config.toolDiameter / _pixel.toMm);

          config.errBlackPixel = size(_img);
          config.imgSize = `(${_height},${_width})pixel to (${round(_height * _pixel.toMm)},${round(_width * _pixel.toMm)})mm`
          fulfill(config);
        });
      })
        .then((config: imgToCode.config) => {
          analyze(config, (dirgcode: string) => {
            fulfill({ dirgcode, config });
          });
        });

    } catch (err) {
      throw new Error(err);
      //fulfill(error);
    }
  })
}
function round(num: number): number {
  return Math.round(num * 100) / 100;
}
/**
 * @param {lwip.Image} image
 * @returns {Pixel[][]}
 */
function getAllPixel(image: lwip.Image): imgToCode.Pixel[][]{
  try {
    function intensityFix(colour: lwip.ColorObject){
      return (colour.r + colour.g + colour.b) * ((colour.a > 1) ? colour.a / 100 : 1) < 10 ? 0 : 765;
    }
    let newArray = [];
    for (let x = 0; x < _width ; x++) {
      let row = []
      for (let y = 0; y < _height; y++) {
        let intensity = intensityFix(image.getPixel(x, y));
        row.push({ axes: { x, y }, intensity, be: intensity !== 0 });
      }
      newArray.push(row);
    }
    return newArray;
  } catch (error) {
    throw error;
  }
}

/**
 * @param {Array} arr
 * @returns {number} size of array
 */
function size(arr: imgToCode.Pixel[][]): number {
  try{
    let size = 0;
    for (let x = 0; x < arr.length; x++) {
      for (let y = 0; y < arr[x].length; y++) {
        if (arr[x][y].intensity < 765 && !arr[x][y].be) size++;
      }
    }
    return size
  } catch (error) {
    throw new Error(`Size ${arr.length*arr[arr.length-1].length}\n ${error}`);
  }
}

/**
 * pixel negros debajo la her para bajar directamente
 * 
 * @returns {Pixel[][]}
 */
function getFirstPixel(): imgToCode.Pixel[][] {
  try{
  for (let x = 0; x < _img.length; x++) {
  for (let y = 0; y < _img[x].length; y++) {
    let pixels:imgToCode.Pixel[][] = [],
      diameter = _pixel.diameter < 1 ? 1 : Math.floor(_pixel.diameter);
    if (x + _pixel.diameter <= _width && y + _pixel.diameter <= _height && _img[x][y].intensity < 765) {
      for (let x2 = 0; x2 < _pixel.diameter; x2++) {
        let row:imgToCode.Pixel[] = [];
        for (let y2 = 0; y2 < _pixel.diameter; y2++) {
          let countBlack = 0, p = _img[x + x2 < _height ? x + x2 : _height][y + y2 < _width ? y + y2 : _width];
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
    throw new Error(`GetFirstPixel\n ${error}`);
  }
}

function analyze(config: imgToCode.config,fulfill:(dirGCode: string)=>void) {
    try {
      let firstPixel: imgToCode.Pixel[][] = getFirstPixel();
      addPixel({
        x: firstPixel[0][0].axes.x,
        y: firstPixel[0][0].axes.y
      }, config.sevaZ);

      let w = (_height * _width) / _pixel.diameter;
      while (w > 0) {
        let nexPixels = nextBlackToMove(firstPixel);
        if (!nexPixels) {
          config.errBlackPixel = round( size(_img) * 100 / config.errBlackPixel);
          new File().save(_gCode, config).then((dirGCode:string) => {
            console.log("-> Sava As:", dirGCode);
            fulfill(dirGCode);
          });
          break;
        }
        firstPixel = toGCode(firstPixel, nexPixels, config.sevaZ);
        w--;
      }
    } catch (error) {
      throw new Error(`Analyze\n ${error}`);
    }
}

function toGCode(oldPixel:imgToCode.Pixel[][], newPixel:imgToCode.Pixel[][],sevaZ:number):imgToCode.Pixel[][] {
  try {
    let pixelLast = newPixel[0][0], pixelFist = oldPixel[0][0];
    if (distanceIsOne(oldPixel, newPixel)) {
      addPixel({
        x: pixelFist.axes.x + (pixelLast.axes.x - pixelFist.axes.x),
        y: pixelFist.axes.y + (pixelLast.axes.y - pixelFist.axes.y),
        z: false//config.blackZ
      });
    } else {
      addPixel({
        z: sevaZ
      });
      addPixel({
        x: pixelFist.axes.x + (pixelLast.axes.x - pixelFist.axes.x),
        y: pixelFist.axes.y + (pixelLast.axes.y - pixelFist.axes.y),
        z: sevaZ
      });
      addPixel({
        z: false//config.blackZ
      });
    }

    appliedAllPixel(newPixel, (p: imgToCode.Pixel) => { p.be = true; });
    return newPixel;
  } catch (error){
    console.error("oldPixel",oldPixel, "\nnewPixel",newPixel,'error:\n',error);
    throw new Error("Pixels are not valid for this configuration.")
  }
}

function addPixel(axes: imgToCode.Axes, sevaZ?: number | boolean) {
  try{
    let sum = _pixel.diameter / 2;
    let X = axes.x ? (axes.x + sum) * _pixel.toMm : undefined;
    let Y = axes.y ? (axes.y + sum) * _pixel.toMm : undefined;
    if (_gCode.length === 0) {
      _gCode.push(new Line({ x: 0, y: 0, z: sevaZ }, `X0 Y0 Z${sevaZ} Line Init`));
      _gCode.push(new Line({ x: X, y: Y, z: sevaZ }, 'With Z max '));
    }
    _gCode.push(new Line({ x: X, y: Y, z: axes.z }));
  } catch (error) {
    throw new Error('AddPixel > G01 '+axes.x ? `X${axes.x ? (axes.x + _pixel.diameter / 2) * _pixel.toMm : undefined}` : '' +axes.y ? `Y${axes.x ? (axes.x + _pixel.diameter / 2) * _pixel.toMm : undefined}` : '' + axes.z!==undefined?`Z${axes.z};`:';'+`\n ${error}`);
  }
}

function distanceIsOne(oldPixel:imgToCode.Pixel[][], newPixel:imgToCode.Pixel[][]): boolean{
  try{
    // tener ecuenta el paso ??
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

/*if(  (disY === 1 && disX === 1) ||(disY === -1 && disX === -1) ||
  (disY === 1 && disX === -1) ||(disY === -1 && disX === 1) ||
  (disY === 0 && disX === 1) ||(disX === 0 && disY === 1) ||
  (disY === 0 && disX === -1) ||(disX === 0 && disY === -1) ||
  (disX === 0 && disY === 0)) {
  console.log(oPixel.axes,oPixel.intensity , nPixel.axes,nPixel.intensity);
  console.log("disX", disX, "disY", disY, "sigX", sigX, "sigY", sigX);
}*/

return (disY === 1 && disX === 1)||
  (disY === 1 && disX === -1)||
  (disY === -1 && disX === 1)||
  (disY === -1 && disX === -1)||
  (disY === 0 && disX === 1)||
  (disX === 0 && disY === 1)||
  (disY === 0 && disX === -1)||
  (disX === 0 && disY === -1)||
  (disX === 0 && disY === 0)

      }
    }
  } catch (error) {
    throw new Error(`DistanceIsOne\n ${error}`);
  }
}

function appliedAllPixel(arr: imgToCode.Pixel[][], cb) {
  try{
    for (let iRow = 0; iRow < arr.length; iRow++) {
      if (arr[iRow].length === 1) {
        cb(arr[iRow][0], iRow);
      }
      for (let iColumn = 0; iColumn < arr[iRow].length - 1; iColumn++) {
        cb( arr[iRow][iColumn] ,iRow,iColumn);
      }
    }
  } catch (error) {
    throw new Error(`AppliedAllPixel\n ${error}`);
  }
}

function lootAtUp(oldPixelBlack: imgToCode.Pixel[][]): imgToCode.Pixel[][] {
  try {
    function add(PLootAtUp: imgToCode.Pixel[]) {
      let arrPixel: imgToCode.Pixel[][] = [];
      for (let iRow = 0; iRow < oldPixelBlack.length; iRow++) {
        let row :imgToCode.Pixel[] = [];
        row.push( PLootAtUp[iRow] );
        for (let iColumn = 0; iColumn < oldPixelBlack[iRow].length-1; iColumn++) {
          row.push(oldPixelBlack[iRow][iColumn]);
        }
        arrPixel.push(row);
        return arrPixel
      }
    }

    let pixels :imgToCode.Pixel[] = [];
    for (let iX = 0; iX < oldPixelBlack.length; iX++) {
      let e = oldPixelBlack[iX][0];
      if (e === undefined || e.axes.y === 0 || e.be) break;
      let pixel = _img[e.axes.x][e.axes.y - 1];
      if (pixel) { pixels.push(pixel); }
    }
    return AllBlack(pixels) ? add(pixels) : null;

  } catch (error) {
    throw new Error(`LootAtUp\n ${error}`);
  }
}
function lootAtLeft(oldPixelBlack:imgToCode.Pixel[][]):imgToCode.Pixel[][] {
  try {
    function add(PLootAtLeft: imgToCode.Pixel[]) {
      let arrPixel: imgToCode.Pixel[][] = [];
      arrPixel.push(PLootAtLeft);
      for (let iRow = oldPixelBlack.length-1; iRow >0 ; iRow--) {
        arrPixel.push(oldPixelBlack[iRow]);
      }
      return arrPixel
    }

    let pixels: imgToCode.Pixel[] = [];
    for (let iColumn = 0; iColumn < oldPixelBlack[0].length; iColumn++) {
      let e = oldPixelBlack[0][iColumn];
      if (e === undefined || e.axes.x === 0 || e.be) break;
      let pixel = _img[e.axes.x - 1][e.axes.y];
      if (pixel) { pixels.push(pixel); }
    }
    return AllBlack(pixels) ? add(pixels) : null;

  } catch (error) {
    throw new Error(`LootAtUp\n ${error}`);
  }
}
function lootAtDown(oldPixelBlack:imgToCode.Pixel[][]) :imgToCode.Pixel[][] {
  try {
    function add(PLootAtDown: imgToCode.Pixel[]) {
      let arrPixel: imgToCode.Pixel[][] = [];
      for (let iRow = 0; iRow < oldPixelBlack.length; iRow++) {
        let row :imgToCode.Pixel[] = [];
        for (let iColumn = 1; iColumn < oldPixelBlack[iRow].length; iColumn++) {
          row.push(oldPixelBlack[iRow][iColumn]);
        }
        row.push(PLootAtDown[iRow]);
        arrPixel.push(row);
      }
      return arrPixel
    }

    let pixels: imgToCode.Pixel[] = [];
    for (let iY = 0; iY < oldPixelBlack[0].length; iY++) {
      let e = oldPixelBlack[iY][oldPixelBlack[0].length - 1];
      if (e === undefined || e.axes.y === _height - 1 || e.be) break;
      let pixel = _img[e.axes.x][e.axes.y + 1];
      if (pixel) { pixels.push(pixel); }
    }
    return AllBlack(pixels) ? add(pixels) : null;

  } catch (error) {
    throw new Error(`LootAtDown\n ${error}`);
  }
}
function lootAtRight(oldPixelBlack:imgToCode.Pixel[][]):imgToCode.Pixel[][] {
  try {
    function add(PLootAtRight: imgToCode.Pixel[]) {
      let arrPixel: imgToCode.Pixel[][] = [];
      for (let iRow = 1; iRow < oldPixelBlack.length; iRow++) {
        arrPixel.push(oldPixelBlack[iRow]);
      }
      arrPixel.push(PLootAtRight);
      return arrPixel
    }

    let pixels: imgToCode.Pixel[] = [];
    for (let iRow = 0; iRow < oldPixelBlack[oldPixelBlack.length-1].length; iRow++) {
      let e = oldPixelBlack[oldPixelBlack.length - 1][iRow];
      if (e === undefined || e.axes.x === _width - 1 || e.be) break;
      let pixel = _img[e.axes.x + 1][e.axes.y];
      if (pixel) { pixels.push(pixel); }
    }
    return AllBlack(pixels) ? add(pixels) : null;

  } catch (error) {
    throw new Error(`LootAtRight\n ${error}`);
  }
}
/**
 * Pensar con los paso y capas que si es negro pero deveser procesado
 * 
 * @param {Pixel[]} oldPixelBlack
 * @returns {boolean}
 */
function AllBlack(oldPixelBlack: imgToCode.Pixel[]): boolean{
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
/**
 * determinar los pixel negro a corre segun la herr.
 * 
 * @param {Pixel[][]} oldPixelBlack
 */
function nextBlackToMove(oldPixelBlack:imgToCode.Pixel[][]):imgToCode.Pixel[][]  {
  try{
    let nextPixelBlack = lootAtUp(oldPixelBlack);
    if (nextPixelBlack) {
      return nextPixelBlack
    } else {
    nextPixelBlack = lootAtLeft(oldPixelBlack)
    if (nextPixelBlack) {
      return nextPixelBlack
    } else {
      nextPixelBlack = lootAtRight(oldPixelBlack)
      if (nextPixelBlack){
        return nextPixelBlack
      } else {
        nextPixelBlack = lootAtDown(oldPixelBlack)
        if (nextPixelBlack){
          return nextPixelBlack
        } else {
          return getFirstPixel();
        }
      }
    }
    }

    //let arrlootAtUp = lootAtUp(oldPixelBlack)
    //let arrlootAtLeft = lootAtLeft(oldPixelBlack)
    //let arrlootAtRight = lootAtRight(oldPixelBlack)
    //let arrlootAtDown = lootAtDown(oldPixelBlack)

  } catch (error) {
    throw new Error(`NextBlackToMove\n ${error}`);
  }
}

export = start
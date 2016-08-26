type Axes = { x:number, y:number, z?:number };
type Pixel = {  intensity :number , axes:Axes ,be :boolean};

import Line from "./line";
import File from "./file";
import * as lwip  from 'lwip';
import * as path  from 'path';
// 0 -- X
// |
// Y
// si la linea es > toolDiameter / 2 se hace
const _log = {
//  nextBlackPixel:  false,
//  distanceIsOne :  false,
//  pixelToGCode  :  false,
//  pixelAround   :  false,
//  removePixel   :  false,
  nextBlackToMove: false,
  getFirstPixel :  false,
  getAllPixel   :  false,
  lookAt        :  false,
//  addPixel      :  false,
  start         :  false,
  main          :  false,
  size          :  false
};
var _dirGCode :string ='myGcode.gcode';
var _dirImg   :string;
var _gCode    :Line[] = [];
var _height   :number = 0;
var _width    :number = 0;
var _img   :Pixel[][] = [];
var config = {  // It is mm
  toolDiameter  : 2,
  //WhiteToZ      : 3,
  //sevaZ         : 7,
  //scaleAxes     : 5
}
//var self = this;

start("./img/test.png");

/**
 * @param {string} dirImg image path
 */
function start(dirImg :string) {
  console.log("->",dirImg)
  //_dirImg = path.resolve(dirImg);
  _dirImg = dirImg;
  _dirGCode = dirImg.substring(0,dirImg.lastIndexOf("."))+'.gcode';
  lwip.open(_dirImg, function(err:Error, image) {
    if(err)console.log(err.message);
    _height = image.height();
    _width  = image.width();
    _img    = getAllPixel(image);
    if(_log.start){ console.log("_height",_height,"_width",_width); }
    if(_log.getAllPixel){ console.log("_img:",_img); }
    main();
  });
}

/**
 * @param {lwip.Image} image
 * @returns {Pixel[][]}
 */
function getAllPixel(image:lwip.Image) :Pixel[][]{
  let newArray = [];
  for (let x = 0; x < _width ; x++) {
    let row = []
    for (let y = 0; y < _height ; y++) {
      let colour = image.getPixel(x,y);
      let intensity = (colour.r + colour.g + colour.b) * ((colour.a > 1) ? colour.a/100 : 1);
      // si intensity == 765 no ponerlo ¿?
      row.push({ axes:{x,y}, intensity , be : false });
    }
    newArray.push(row);
  }
  return newArray;
}

/**
 * @param {Array} arr
 * @returns {number} size of array
 */
function size(arr : any[][]) :number {
  let size = 0;
  if(_log.size){console.log(arr.length*arr[arr.length-1].length);}
  for (let x = 0; x < arr.length; x++) {
    let arrX = arr[x];
    for (let y = 0; y < arrX.length; y++) {
      if (arrX[y] ) size++;
    }
  }
  return size
}

/**
 * pixel negros debajo la her para bajar directamente
 * 
 * @returns {Pixel[][]}
 */
function getFirstPixel() :Pixel[][] {

  for (let x = 0; x < _img.length; x++) {
  for (let y = 0; y < _img[x].length; y++) {
    if(_log.main){console.log(`for ${x},${y} -> ${_img[x][y].axes.x},${_img[x][y].axes.y} -> ${_img[x][y].intensity}`);}
    let pixels :Pixel[][] = [];
    if( x+config.toolDiameter< _width && y+config.toolDiameter<_height && _img[x][y] && _img[x][y].intensity < 765 ){
      for (let x2 = 0; x2 < config.toolDiameter; x2++) {
        let row :Pixel[] = [];
        for (let y2 = 0; y2 < config.toolDiameter; y2++) {
          let p = _img[ x+x2<_width?x+x2:_width ][ y+y2<_height?y+y2:_height ];
          if(p.intensity < 765){ row.push(p); }
          else{ break; }
        }
        pixels.push(row);
      }
      if( size(pixels) === config.toolDiameter*2 ){
        return pixels;
      }
    }else {
      if(_log.getFirstPixel)console.log(`${x+config.toolDiameter}< ${_width} && ${y+config.toolDiameter}<${_height} && ${_img[x][y].intensity} < 765`);
    }
  }// for
  }// for

}

function main() {
  console.log('G21 ; Set units to mm');
  console.log('G90 ; Absolute positioning');
  console.log('G01 X0 Y0 Z765; con Z max');

  let firstPixel: Pixel[][] = getFirstPixel();
  addPixel(firstPixel[0][0].axes);

let i = 0;  
  while ( i<3) {
    //console.log("firstPixel",'\n',firstPixel[0][0].axes, firstPixel[0][1].axes,'\n',firstPixel[1][0].axes, firstPixel[1][1].axes);
    let nexPixels = nextBlackToMove(firstPixel);
    //console.log("nexPixels",'\n',nexPixels[0][0].axes, nexPixels[0][1].axes,'\n',nexPixels[1][0].axes, nexPixels[1][1].axes);
    toGCode(firstPixel, nexPixels);
    firstPixel = nexPixels;
i++;
  }

}

function toGCode(oldPixel: Pixel[][], newPixel: Pixel[][]) {
  let pixelToMm = 1; // 1 pixel es X mm
  let pixelFist = newPixel[newPixel.length - 1][newPixel[newPixel.length - 1].length - 1];
  let pixelLast = oldPixel[0][0];
  addPixel({
    x: pixelFist.axes.x - pixelLast.axes.x,
    y: pixelFist.axes.y - pixelLast.axes.y
  });

  // a  oldPixel y newPixel indicar que a esos pixeles ya lo use
  forEachPixel(oldPixel , (p :Pixel)=>{ p.be = true; });
}

function addPixel( axes :Axes){
  let pixelToMm = 1; // 1 pixel es X mm
  let X = axes.x + config.toolDiameter / 2;
  let Y = axes.y + config.toolDiameter / 2;
  console.log(`G01 X${X} Y${Y}`, axes.z ? `Z${axes.z}` : '');
  //console.log( pixels[0][0].axes , pixels[0][pixels[0].length-1].axes );
  //console.log( pixels[pixels.length-1][0].axes , pixels[pixels.length-1][pixels[pixels.length-1].length-1].axes );
}

function forEachPixel(p :Pixel[][], cb ){
  for (let iRow = 0; iRow < p.length; iRow++) {
    for (let iColumn = 0; iColumn < p[iRow].length-1; iColumn++) {
      cb( _img[iRow][iColumn] ,iRow,iColumn);
    }
  }
}

/**
 * array [n][m] n = m = toolDiameter
 * @returns {Pixel[][]}
 */
function unprocessedPixelBelowTool() :Pixel[][]{
  // no blanco debajo de la tool
  let pixelBelowTool :Pixel[][] = [];
  let pixelWhite = 0; 
  for (let x = 0; x < _img.length; x++) {
  for (let y = 0; y < _img[x].length; y++) {
    if( _img[x][y].be ){
      for (let x2 = 0; x2 < config.toolDiameter; x2++) {
        let row :Pixel[] = [];
        for (let y2 = 0; y2 < config.toolDiameter; y2++) {
          let p = _img[ x+x2<_width?x+x2:_width ][ y+y2<_height?y+y2:_height ];
          if(p.intensity === 765){ 
            pixelWhite++;
            if(pixelWhite > config.toolDiameter*2){
              console.log("muchos blancos");
            }
          }
          row.push(p);
        }
        pixelBelowTool.push(row);
      }
    }
    return pixelBelowTool
  }
  }
}

function lootAtUp(oldPixelBlack:Pixel[][]) :Pixel[] {
  let pixels :Pixel[] = [];
  for (let iX = 0; iX < oldPixelBlack.length; iX++) {
    let e = oldPixelBlack[iX][0];
    let pixel = _img[e.axes.x][e.axes.y-1]
    if(pixel) pixels.push(pixel);
    if(_log.lookAt){
      // 2,1 3,1
      console.log("axes",e.axes,"x,y-1",pixel.axes);
      // 2,0 3,0
    }
  }
  return pixels;
}
function lootAtLeft(oldPixelBlack:Pixel[][]) :Pixel[] {
  let pixels :Pixel[] = [];
  for (let iColumn = 0; iColumn < oldPixelBlack[0].length; iColumn++) {
    let e = oldPixelBlack[0][iColumn];
    let pixel = _img[e.axes.x-1][e.axes.y]
    if(pixel) pixels.push(pixel);
    if(_log.lookAt){
      // 2,1 2,2
      console.log("axes",e.axes,"x-1,y",pixel.axes);
      // 1,1 1,2
    }
  }
  return pixels;
}
function lootAtDown(oldPixelBlack:Pixel[][]) :Pixel[] {
  let pixels :Pixel[] = [];
  for (let iY = 0; iY < oldPixelBlack[0].length; iY++) {
    let e = oldPixelBlack[iY][oldPixelBlack[0].length-1];
    let pixel = _img[e.axes.x][e.axes.y+1]
    if(pixel) pixels.push(pixel);
    if(_log.lookAt){
      // 2,2 3,2
      console.log("axes",e.axes,"x,y+1",pixel.axes);
      // 2,3 3,3
    }
  }
  return pixels;
}
function lootAtRight(oldPixelBlack:Pixel[][]) :Pixel[] {
  let pixels :Pixel[] = [];
  for (let iRow = 0; iRow < oldPixelBlack[oldPixelBlack.length-1].length; iRow++) {
    let e = oldPixelBlack[oldPixelBlack.length-1][iRow];
    let pixel = _img[e.axes.x+1][e.axes.y]
    if(pixel) pixels.push(pixel);
    if(_log.lookAt){
      // 3,1 3,2
      console.log("axes",e.axes,"x+1,y",pixel.axes);
      // 4,1 4,2
    }
  }
  return pixels;
}
/**
 * Pensar con los paso y capas que si es negro pero deveser procesado
 * 
 * @param {Pixel[]} oldPixelBlack
 * @returns {boolean}
 */
function AllBlack(oldPixelBlack:Pixel[]) :boolean{
  let answer = true;
  for (let x = 0; x < oldPixelBlack.length; x++) {
    if (oldPixelBlack[x].intensity === 765 || oldPixelBlack[x].be) { answer = false } else { console.log("esta procesado o es blanco") };
  }
  return answer;
}
/**
 * determinar los pixel negro a corre segun la herr.
 * 
 * @param {Pixel[][]} oldPixelBlack
 */
function nextBlackToMove(oldPixelBlack:Pixel[][]) :Pixel[][]  {
  // look at "1 2 3" up
  let PLootAtUp = lootAtUp(oldPixelBlack);
  // look at "1 4 7" left (<-o)
  let PLootAtLeft = lootAtLeft(oldPixelBlack);
  // look at "3 6 9" right (o->)
  let PLootAtRight = lootAtRight(oldPixelBlack);
  // look at "7 8 9" down
  let PLootAtDown = lootAtDown(oldPixelBlack);

  let arrPixel :Pixel[][] = [];

  // sortear por donde empezar ?¿?¿?¿
  if( AllBlack(PLootAtUp) ){
    if(_log.nextBlackToMove) console.log("PLootAtUp\n",PLootAtUp);

    for (let iRow = 0; iRow < oldPixelBlack.length; iRow++) {
      let row :Pixel[] = [];
      row.push( PLootAtUp[iRow] );
      for (let iColumn = 0; iColumn < oldPixelBlack[iRow].length-1; iColumn++) {
        row.push( oldPixelBlack[iRow][iColumn] );
      }
      arrPixel.push(row);
    }

  }else if( AllBlack(PLootAtLeft) ){
    if(_log.nextBlackToMove)console.log("PLootAtLeft\n",PLootAtLeft);

    arrPixel.push(PLootAtLeft);
    for (let iRow = oldPixelBlack.length-1; iRow >0 ; iRow--) {
      let e = oldPixelBlack[iRow];
      arrPixel.push(e);
    }

  }else if( AllBlack(PLootAtRight) ){
    if(_log.nextBlackToMove)console.log("PLootAtRight\n",PLootAtRight);

    for (let iRow = 1; iRow < oldPixelBlack.length; iRow++) {
      let e = oldPixelBlack[iRow];
      arrPixel.push(e);
    }
    arrPixel.push(PLootAtRight);

  }else if( AllBlack(PLootAtDown) ){
    if(_log.nextBlackToMove)console.log("PLootAtDown\n",PLootAtDown);

    for (let iRow = 0; iRow < oldPixelBlack.length; iRow++) {
      let row :Pixel[] = [];
      for (let iColumn = 1; iColumn < oldPixelBlack[iRow].length; iColumn++) {
        row.push( oldPixelBlack[iRow][iColumn] );
      }
      row.push(PLootAtDown[iRow]);
      arrPixel.push(row);
    }

  }else{
    console.log("buscar por otro lado");
    // buscar otros pixel
  }

  if (_log.nextBlackToMove) {
    forEachPixel(arrPixel, (e,iRow,iColumn) => {
      console.log(iRow,iColumn,"e",e.axes,"intensity",e.intensity);
    })
  }

  return arrPixel;
}
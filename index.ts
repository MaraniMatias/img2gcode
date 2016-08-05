type Axes = { x:number, y:number, z?:number };
type Pixel = {  intensity :number , axes:Axes };

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
  getAllPixel   :  false,
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
    mani();
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
      row.push({ axes:{x,y}, intensity  });
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

function mani() {
  for (let x = 0; x < _img.length; x++) {
  for (let y = 0; y < _img[x].length; y++) {
    if(_log.main){console.log(`for ${x},${y} -> ${_img[x][y].axes.x},${_img[x][y].axes.y} -> ${_img[x][y].intensity}`);}

    if( _img[x][y] ){

    }

  }
  }

  /*
  let oldPixel :Pixel[][] = unprocessedPixelBelowTool();
  console.log("oldPixel",oldPixel);
  let newPixel :Pixel[][] = nextBlackPixelBelowTool(oldPixel);
  console.log("newPixel",newPixel);
  */
}


/**
 * cordenadas de los pixel cercanos
 * @param {number[]} axes
 * @returns {Pixel[]}
*/
function pixelAround(oldPixel:Pixel[][]) {
  // 1 2 3
  // 4 5 6
  // 7 8 9
  // devolver 9 elemntos con pixel debajo de la heramienta
  let pixelAround :Pixel[][] = [];

  let pixelTool :Pixel[][] = [];

  let row0 = [];
  // 0,0
  // 0,1  ->
  // 0,2
  let row1 = [];
  // 1,0 ->
  // 1,1 -> oldPixel
  // 1,2 ->
  let row2 = [];
  // 2,0
  // 2,1 ->
  // 2,2
}

/**
 * array [n][m] n = m = toolDiameter
 * @returns {Pixel[][]}
 */
function unprocessedPixelBelowTool() :Pixel[][]{
  // no blanco debajjo de la tool
  let pixelBelowTool :Pixel[][] = [];
  let pixelWhite = 0; 
  for (let x = 0; x < _img.length; x++) {
  for (let y = 0; y < _img[x].length; y++) {
    if( _img[x][y] ){
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
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
  getFirstPixel :  false,
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
  let firstPixel :Pixel[][] = getFirstPixel();

  nextBlackToMove(firstPixel);

}getFirstPixel

function toGCode( pixels:Pixel[][] ){

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


function nextBlackToMove(oldPixelBlack:Pixel[][]) {
  // devolver los pixel negros que puedan correr la her
  //let numberOfPixelToLook = config.toolDiameter/2; // no es necesario

  console.log(0,oldPixelBlack[0][0].axes);
  console.log(0,oldPixelBlack[0][1].axes);
  console.log(1,oldPixelBlack[1][0].axes);
  console.log(1,oldPixelBlack[1][1].axes);
  // 1 2 3
  // 4 5 6
  // 7 8 9

// look at "1 2 3" up
  for (var iX = 0; iX < oldPixelBlack.length; iX++) {
    var element = oldPixelBlack[iX][0];
    // 2,1 3,1
    console.log("axes",element.axes,"x,y-1 (",element.axes.x,element.axes.y-1,")");
    // 2,0 3,0
  }

// look at "1 4 7" left (<-o)
  for (var iColumn = 0; iColumn < oldPixelBlack[0].length; iColumn++) {
    var element = oldPixelBlack[0][iColumn];
    // 2,1 2,2
    console.log("axes",element.axes,"x-1,y (",element.axes.x-1,element.axes.y,")");
    // 1,1 1,2
  }

// look at "3 6 9" right (o->)
  for (var iRow = 0; iRow < oldPixelBlack[oldPixelBlack.length-1].length; iRow++) {
    var element = oldPixelBlack[oldPixelBlack.length-1][iRow];
    // 3,1 3,2
    console.log("axes",element.axes,"x+1,y (",element.axes.x+1,element.axes.y,")");
    // 4,1 4,2
  }

// look at "7 8 9" down
  for (var iY = 0; iY < oldPixelBlack[0].length; iY++) {
    var element = oldPixelBlack[iY][oldPixelBlack[0].length-1];
    // 2,2 3,2
    console.log("axes",element.axes,"x,y+1 (",element.axes.x,element.axes.y+1,")");
    // 2,3 3,3
  }
}
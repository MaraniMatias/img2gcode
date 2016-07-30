type Pixel = { colour:lwip.ColorObject, intensity :number , axes:Axes };
type Axes = { x:number, y:number, z?:number };

import Line from "./line";
import File from "./file";
import * as lwip  from 'lwip';
import * as path  from 'path';
// 0 -- X
// |
// Y
const _log = {
  nextBlackPixel:  false,
  distanceIsOne :  false,
  pixelToGCode  :  false,
  pixelAround   :  false,
  removePixel   :  false,
  getAllPixel   :  false,
  addPixel      :  false,
  main          :  false,
  size          :  false
};
var _dirGCode :string ='myGcode.gcode';
var _dirImg   :string;
var _gCode    :Line[] = [];
var _height   :number = 0;
var _width    :number = 0;
var _img   :Pixel[][] = [];
//var self = this;

/**
 * getAllPixel
 * 
 * @param {lwip.Image} image
 * @returns {Pixel[][]}
 */
function getAllPixel(image:lwip.Image) :Pixel[][]{
  if(_log.getAllPixel){console.log("_width:",_width,"_height:",_height)}
  let newArray = [];
  for (let x = 0; x < _width ; x++) {
    let row = []
    for (let y = 0; y < _height ; y++) {
      let colour = image.getPixel(x,y);
      let intensity = (colour.r + colour.g + colour.b) * ((colour.a > 1) ? colour.a/100 : 1);
      row.push({  colour,axes:{x,y},intensity  });
    }
    newArray.push(row);
  }
  return newArray;
}

/**
 * getPixel
 * 
 * @function
 * @param {number} left or X
 * @param {number} top or Y
 * @returns {Pixel}
 */
function getPixel(left :number, top :number) : Pixel {
  return _img[left][top];
}

/**
 * addPixel
 * 
 * @function
 * @param {Pixel} pixel
 * @param {boolean} [show] default true
 * @param {string} [coment]
 * @returns {Pixel}
*/
function addPixel(pixel :Pixel, show ?:boolean, coment ?:string) :Pixel {
  let index = _gCode.push( new Line(show===undefined?true:show,pixel,coment) );
  if(_log.addPixel && (show===undefined)){  console.log( _gCode[index-1].code())  }
  removePixel(pixel.axes.x,pixel.axes.y);
  return pixel;
}

/**
 * removePixel
 * 
 * @function
 * @param {number} left or X
 * @param {number} top or Y
 * @returns {Pixel[][]}
 */
function removePixel(left :number, top :number) : Pixel[][] {
  if(_log.removePixel){console.log("removePixel:\n","left:",left,"top:",top,_img[left][top]);}
  if(_img[left][top]){delete _img[left][top];}
  else{if(_log.removePixel)console.log("It isn't:",left,top);}
  return _img;
}

/**
 * size
 * 
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
 * pixelToGCode
 * 
 * @function
 * @param {Pixel} oldPixel
 * @param {Pixel} newPixel
 */
function pixelToGCode(oldPixel :Pixel,newPixel :Pixel){
  if(_log.pixelToGCode){console.log( "pixelToGCode\noldPixel ->\n" , oldPixel.axes, "\nnewPixel ->\n" , newPixel.axes  );}
//disX 1 disY 2 newPixel x:1, y:3 oldPixel x:0, y:1
  // White to Black
  if ( oldPixel.intensity > newPixel.intensity ) {
    if ( ! distanceIsOne(newPixel,oldPixel) ) {
      addPixel({
        axes : { x : oldPixel.axes.x, y : oldPixel.axes.y , z : 765 },
        colour : oldPixel.colour,
        intensity : 765
      });
      addPixel({
        axes : { x : newPixel.axes.x, y : newPixel.axes.y , z : 765 },
        colour : oldPixel.colour,
        intensity : 765
      });
    }
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
      colour : newPixel.colour,
      intensity : newPixel.intensity
    });
  }

  // Black to White
  else if ( oldPixel.intensity < newPixel.intensity ) {
    addPixel({
      axes : { x : oldPixel.axes.x, y : oldPixel.axes.y , z : 765 },
      colour : oldPixel.colour,
      intensity : 765
    })
    /*BaddPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y , z : 765 },
      colour : oldPixel.colour,
      intensity : 765
    })*/
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
      colour : newPixel.colour,
      intensity : newPixel.intensity
    });
    /*
    addPixel({
      axes : { x : oldPixel.axes.x, y : oldPixel.axes.y, z : newPixel.intensity },
      colour : newPixel.colour,
      intensity : newPixel.intensity
    });
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
      colour : newPixel.colour,
      intensity : newPixel.intensity
    },false);// porque estas son las corrdenadas nuevas
    */
  }

  // Black to Black
  else if (newPixel.intensity < 765 && oldPixel.intensity === newPixel.intensity ) {
    if ( ! distanceIsOne(newPixel,oldPixel) ) {
      addPixel({
        axes : { x : oldPixel.axes.x, y : oldPixel.axes.y , z : 765 },
        colour : oldPixel.colour,
        intensity : 765
      });
      addPixel({
        axes : { x : newPixel.axes.x, y : newPixel.axes.y , z : 765 },
        colour : oldPixel.colour,
        intensity : 765
      });
    }
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
      colour : newPixel.colour,
      intensity : newPixel.intensity
    });
  } else {  addPixel(newPixel,false);  }

  return newPixel;
}
function distanceIsOne(newPixel :Pixel, oldPixel :Pixel) :boolean{
  let disX = newPixel.axes.x - oldPixel.axes.x ;
  let disY = newPixel.axes.y - oldPixel.axes.y ;
  if(_log.distanceIsOne)console.log("disX",disX,"disY",disY,"newPixel",newPixel.axes,"oldPixel",oldPixel.axes,disX === 1 || disY === 1 || disX === -1 || disY === -1);
  // con medidas de fresa y escalas acomodar
  let sigX = disX >0 ? 1 : -1;
  let sigY = disY >0 ? 1 : -1;
  return ( disX === sigX && ( disY === 0 || disY === sigY ) )||
  ( disY === sigY && ( disX === 0 || disX === sigX ) )|| disY === 0 && disX === 0
}
/**
 * Is the pixel in the GCode ?
 *
 * @param {Pixel} pixel
 * @returns {boolean} 
 */
function isPixelnGCode(pixel :Pixel) :boolean{
  for (let index = 0; index < _gCode.length; index++) {
    // true && true -> pixel esta
    if( _gCode[index].axes.x === pixel.axes.x && _gCode[index].axes.y === pixel.axes.y) {
      return true;
    }
  }
}

/**
 * cordenadas de los pixel cercanos
 * 
 * @param {number[]} axes
 * @returns {Pixel[]}
*/
function pixelAround(axes :number[],oldPixel:Pixel) :Pixel[] {
  let pixels :Pixel[] = [];
  for (let i = 0; i < axes.length ; i++) {
  for (let j = 0; j < axes.length ; j++) {
    let x : number = oldPixel.axes.x + axes[i]
      , y : number = oldPixel.axes.y + axes[j]
    ;
    if( (x>=0 && y>=0) && (y < _width && x < _height) && !( oldPixel.axes.x == x && oldPixel.axes.y == y ) ){
      let p = getPixel(x,y);
      if(_log.pixelAround){console.log("pixelAround:","x:",x,"y:",y,"\npixel:",p)}
      if( p != undefined ){
        pixels.push( p );
      }else{
        if(_log.pixelAround){console.log(`(${x},${y}) -> ${getPixel(x,y)}`)}
      }
    }
    //if(i+1 == axes.length && j+1 == axes.length) return pixels
  }
  }
  return pixels
}// pixelAround

/**
 * unprocessedPixel
 * 
 * @function
 * @returns {Pixel}
 */
function unprocessedPixel() :Pixel {
  for (let x = 0; x < _img.length; x++) {
    for (let y = 0; y < _img[x].length; y++) {
      if( _img[x][y] ){  return getPixel(x,y);  } 
    }
  }
}

/**
 * main
 * 
 * @param {number} [top]
 * @param {number} [left]
 */
function mani(top? :number, left? :number) {
  let oldPixel :Pixel = addPixel(getPixel(0,0),true,"---> pixel start <---")
    , s = size(_img);

  for (let i = 0; i < s; i++) {
    if(_log.size){  console.log("size",size(_img));  }
    let newPixel :Pixel = nextBlackPixel(oldPixel);
    //console.log("\nnextBlackPixel",nextBlackPixel(oldPixel),"\nunprocessedPixel",unprocessedPixel());
    oldPixel = pixelToGCode(lasPixelGCode(),newPixel?newPixel:unprocessedPixel());
  }

  _gCode.push( new Line(true,{
      axes : { x : undefined, y : undefined , z : 765 },
      colour : oldPixel.colour,
      intensity : 765
    },"---> this code is for cnc-ino <---") );
  new File().save( _dirGCode, _gCode, () => {  console.log("guardado :D\n",_dirGCode);  });

}

function lasPixelGCode() :Pixel {
  for (let index = _gCode.length - 1 ; index >= 0 ; index--) {
    if(_gCode[index].show){ 
      return {
        axes  :  _gCode[index].axes,
        colour  :  _gCode[index].colour,
        intensity  :  _gCode[index].intensity
      };
    }
  }
}

/**
 * nextBlackPixel
 * 
 * @function
 * @param {Pixel} oldPixel
 */
function nextBlackPixel(oldPixel :Pixel) :Pixel|any {
  if(_log.nextBlackPixel){console.log("nextBlackPixel:\n\toldPixel:",oldPixel)}
  let axesAround :number[] = [0,1,-1] // unida sumadas para pixel cercanos
    , pixelsA :Pixel[] = pixelAround( axesAround , oldPixel );
  if(_log.nextBlackPixel){console.log("pixelsA:",pixelsA)}
  for (let index = 0; index < pixelsA.length; index++) {
    if(_log.nextBlackPixel){console.log(`pixelsA[${index}]:`,pixelsA[index].axes)}
    if(_log.nextBlackPixel){console.log("nextBlackPixel:",pixelsA[index]);}
    // Is it a black pixel?
    if( pixelsA[index].intensity < 765 ){  return pixelsA[index];  }
  }
}

/**
 * start
 * 
 * @param {string} dirImg image path
 */
function start(dirImg :string) {
  //_dirImg = path.resolve(dirImg);
  _dirImg = dirImg;
  _dirGCode = dirImg.substring(0,dirImg.lastIndexOf("."))+'.gcode';
  lwip.open(_dirImg, function(err:Error, image) {
    if(err)console.log(err.message);
    _height = image.height();
    _width = image.width();
    _img = getAllPixel(image);
    mani();
  });
}

start("./img/x.png");
type Pixel = { colour:lwip.ColorObject, intensity :number , axes:Axes };
type Axes = { x:number, y:number, z?:number };

import Line from "./line";
import File from "./file";
import * as lwip  from 'lwip';
import * as path  from 'path';

const _log    : any = {
  nextBlackPixel:  false,
  pixelToGCode  :  false,
  pixelAround   :  false,
  addPixel      :  !false,
  main          :  false
};
var _dirGCode :string ='myGcode.gcode';
var _dirImg   :string;
var _img      :lwip.Image;
var _gCode    :Line[] = [];
var _height   :number = 0;
var _width    :number = 0;
//var self = this;
/**
 * getPixel
 * 
 * @function
 * @param {number} left
 * @param {number} top
 * @returns {Pixel}
 */
function getPixel(left :number, top :number) : Pixel {
  let pixel = _img.getPixel(left,top);
  let intensity = (pixel.r + pixel.g + pixel.b) * ((pixel.a > 1) ? pixel.a/100 : 1);
  return { colour: pixel, intensity : intensity , axes : {x:left,y:top} }
}
/**
 * addPixel
 * 
 * @function
 * @param {Pixel} pixel
 * @param {boolean} [show] default true
 * @param {string} [coment]
*/
function addPixel(pixel :Pixel, show ?:boolean, coment ?:string) :Pixel {
  let index = _gCode.push( new Line(show===undefined?true:show,pixel,coment) );
  if(_log.addPixel && (show===undefined)){  console.log( _gCode[index-1].code())  }
  return pixel;
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

  // White to Black
  if ( oldPixel.intensity > newPixel.intensity ) {
    // Z en otro linea
    if ( !(newPixel.axes.x - oldPixel.axes.x === 1 || newPixel.axes.y - oldPixel.axes.y === 1) ){
      // es cuando el pixel esta lejos de esta posision
      // maxZ o capas oldPixel.intensity
      newPixel.axes.z = oldPixel.intensity; // copas Zmas porque esta en otra liena
      addPixel(newPixel);
    }
    // primero mover al pixel negro , con Z anterior
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y },
      colour : newPixel.colour,
      intensity : oldPixel.intensity
    })
    // depues bajar
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
      colour : newPixel.colour,
      intensity : newPixel.intensity
    })
  }
  // Black to White
  else if ( oldPixel.intensity < newPixel.intensity ) {
    // solo subo
    addPixel({
      axes : { x : oldPixel.axes.x, y : oldPixel.axes.y, z : oldPixel.intensity },
      colour : oldPixel.colour,
      intensity : newPixel.intensity
    });
    // solo para agregar que ya use este pixel
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
      colour : newPixel.colour,
      intensity : newPixel.intensity
    },false);
  }
  // Black to Black
  else if (newPixel.intensity < 765 && oldPixel.intensity === newPixel.intensity ) {
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y },
      colour : newPixel.colour,
      intensity : newPixel.intensity
    });
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
      colour : newPixel.colour,
      intensity : newPixel.intensity
    });
  }else {
    addPixel(newPixel,false)
  }
  return newPixel;
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
    // pixel cercanos
    if( (x>=0 && y>=0) && (y < _width && x < _height) ){
      if(_log.pixelAround){console.log("pixelAround:","x:",x,"y:",y)}
      pixels.push( getPixel(x,y) );
    }
    if(i+1 == axes.length && j+1 == axes.length) return pixels
  }
  }
}// pixelAround

/**
 * unprocessedPixel
 * 
 * @function
 * @returns {Pixel}
 */
function unprocessedPixel() :Pixel {
  let next   :boolean = true, pixel : Pixel;
  for (let y = 0; y < _height && next; ++y) {
    for (let x = 0; x < _width && next; ++x) {
      pixel = getPixel(x,y);
      next = false; // asumo que no esta
      let toBe = false; // Is pixel in gCode ?
      for (let i = 0; i < _gCode.length && !toBe ; i++) {
        let e = _gCode[i].axes;
        // true && true -> It is in gCode
        if( e.x === x && e.y === y){
          // pixel is in gCode then finsh for gCode
          toBe = true; // pixel found
          next = true; // next pixel in img
        }
      }
    }
  }
  return pixel;
}

/**
 * main
 * 
 * @param {number} [top]
 * @param {number} [left]
 */
function mani(top? :number, left? :number) {
  let oldPixel :Pixel = addPixel(getPixel(0,0),true,"---> pixel start <---")

  let totalPixel = _height*_width;
  for (let x = 0; x < _height; x++) {
  for (let y = 0; y < _width; y++) {
    //if(x<_height && y<_width){
      let newPixel :Pixel = nextBlackPixel(oldPixel);
      oldPixel = pixelToGCode(lasPixelGCode(),newPixel?newPixel:unprocessedPixel());
    //}else{
    //  x=_height,y=_width;
    //  new File().save( _dirGCode, _gCode, () => {  console.log("guardar :D");  });
    //}
  }
  }
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
  let axesAround :number[] = [0,1,-1] // unida sumadas para pixel cercanos
    , newPixel :{ pixel :Pixel, be :boolean } //= <{pixel :Pixel, be :boolean}>{be:false}
  ;
  let pixelsA :Pixel[] = pixelAround( axesAround , oldPixel );
  for (let index = 0; index < pixelsA.length; index++) {
    let pixel :Pixel = pixelsA[index];
    // Is it a black pixel?
    if( pixel.intensity < 765 ){
      // Is the pixel in the GCode ?
      if( !isPixelnGCode(pixel) ){
        if(_log.nextBlackPixel){console.log("nextBlackPixel:",pixel);}
        return pixel;
      }
    }else{
      // guardar pixel seguientes y no negros ??
      addPixel(pixel,false);
    }
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
  lwip.open(_dirImg, function(err, image) {
    _height = image.height();
    _width = image.width();
    _img = image;
    mani();
  });
}

start("./img/130x130.png");
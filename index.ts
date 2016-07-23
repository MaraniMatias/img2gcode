type Pixel = { colour:lwip.ColorObject, intensity :number , axes:Axes };
type Axes = { x:number, y:number, z?:number };

import Line from "./line";
import File from "./file";
import * as lwip  from 'lwip' ;

const _log    :boolean = true;
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
function addPixel(pixel :Pixel, show ?:boolean, coment ?:string) :void {
  _gCode.push( new Line(show?show:true,pixel,coment) );
}
/**
 * pixelToGCode
 * 
 * @function
 * @param {Pixel} oldPixel
 * @param {Pixel} newPixel
 */
function pixelToGCode(oldPixel :Pixel, newPixel :Pixel) {
  let index : number = _gCode.length!==0 ? _gCode.length-1 : 0 ;
  let gCodeLast : Line = _gCode[index];

  if(_log){
    console.log("pixelToGCode\n");
    console.log( index + "gCodeLast ->\n" , gCodeLast  );
    console.log( "newPixel ->\n" , newPixel  );
  }

  // White to Black
  if ( oldPixel.intensity > newPixel.intensity ) {
    // Z en otro linea
    if ( !(newPixel.axes.x - gCodeLast.axes.x === 1 || newPixel.axes.y - gCodeLast.axes.y === 1) ){
      // es cuando el pixel esta liejos de esta posision
      // maxZ o capas oldPixel.intensity
      newPixel.axes.z = oldPixel.intensity; // copas Zmas porque esta en otra liena
      addPixel(newPixel);
    }
    // primero al pixel negro , con Z anterior
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y },
      colour : newPixel.colour,
      intensity : newPixel.intensity,
    })
    // depues bajar
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
      colour : newPixel.colour,
      intensity : newPixel.intensity,
    })
  }
  // Black to White
  if ( oldPixel.intensity < newPixel.intensity ) {
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
      colour : newPixel.colour,
      intensity : newPixel.intensity,
    })
  }
  // Black to Black
  if ( newPixel.intensity == 0 && oldPixel.intensity == newPixel.intensity ) {
    // ver bien para otros colores y para analisis con mmMax mmMin
    addPixel({
      axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
      colour : newPixel.colour,
      intensity : newPixel.intensity,
    })
  }
}
/**
 * nextBlackPixel
 * 
 * @function
 * @param {Pixel} oldPixel
 * @returns {Pixel}
 */
function nextBlackPixel(oldPixel :Pixel) :Pixel | any {
  let axesAround :number[] = [0,1,-1] // unida sumadas para pixel cercanos
    , newPixel :{ pixel :Pixel, be :boolean } //= <{pixel :Pixel, be :boolean}>{be:false}
  ;
  let pixelsA :Pixel[] = pixelAround( axesAround );
  for (let index = 0; index < pixelsA.length; index++) {
    let pixel :Pixel = pixelsA[index];
    // Is it a black pixel?
    if( pixel.intensity < 765 ){
      // Is the pixel in the GCode ?
      if( !isPixelnGCode(pixel) ){
        return pixel;
      }
    }else{
      // guardar pixel seguientes y no negros ??
      addPixel(pixel,false)
    }
    // no hay pixel sin procesar
    if(index+1 == pixelsA.length){
      return undefined;
    }
  }

  /**
   * Is the pixel in the GCode ?
   *
   * @param {Pixel} pixel
   * @returns {boolean} 
   */
  function isPixelnGCode(pixel :Pixel) :boolean{
    for (let index = 0; index < _gCode.length; index++) {
      let toBe = false;
      if( index == _gCode.length || toBe){
        return toBe;
      }else{
        // true && true -> pixel esta
        toBe = ( _gCode[index].axes.x === pixel.axes.x && _gCode[index].axes.y === pixel.axes.y);
      }
    }
  }
  /**
   * cordenadas de los pixel cercanos
   * 
   * @param {number[]} axes
   * @returns {Pixel[]}
  */
  function pixelAround(axes :number[]) :Pixel[] {
    let pixels :Pixel[] = [];
    for (let i = 0; i < axes.length ; i++) {
    for (let j = 0; j < axes.length ; j++) {
      let x : number = oldPixel.axes.x + axes[i]
        , y : number = oldPixel.axes.y + axes[j]
      ;
      // pixel cercanos
      if( (x>=0 && y>=0) && (y <= _width && x <= _height) ){
        pixels.push( getPixel(x,y) );
      }
      if(i+1 == axes.length && j+1 == axes.length) return pixels
    }
    }
  }// pixelAround

}

/**
 * unprocessedPixel
 * 
 * @function
 * @returns {Pixel}
 */
function unprocessedPixel() :Pixel {
  let next   :boolean = true
    , pixel : Pixel
  ;
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
function main(top :number, left :number) {    
  // add pixel 0,0 o por el primero.
  let oldPixel :Pixel = getPixel( top, left);
  // (3)
  // nuevo pixel blanco o siguiente
  let newPixel :Pixel = nextBlackPixel(oldPixel);
  if( newPixel === undefined ){  // este y (1) los anide por si separo los if capas que resuelve jutos
    newPixel = unprocessedPixel();
    if( newPixel !== undefined ){ // (1)
      pixelToGCode(oldPixel,newPixel);
      oldPixel = newPixel;
      // volver a (3)
    }else{
      new File().save(_dirGCode,_gCode, () => {
        console.log("guardar :D");
      })
    }
  }else{
    pixelToGCode(oldPixel,newPixel);
    oldPixel = newPixel;
    // volver a (3)
  }
}
/**
 * start
 * 
 * @param {string} dirImg image path
 */
function start(dirImg :string, top ?:number, left ?:number) {
  _dirImg = dirImg;
  _dirGCode = dirImg.substring(0,dirImg.lastIndexOf("."))+'.gcode';
  lwip.open(_dirImg, function(err, image) {
    _height = image.height();
    _width = image.width();
    _img = image;
    main(top!=undefined?top:0, left!=undefined?left:0 );
  });
}

start("./img/25x25.png"); //4,2
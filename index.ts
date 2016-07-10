type Pixel = { colour:lwip.ColorObject, intensity :number , axes:Axes };
type Axes = {x:number, y:number, z?:number };

import Line from "./line";
import File from "./file";
import * as lwip  from 'lwip' ;
/**
 * ImgToGCode
 */
class ImgToGCode {
/*
const maxZ : number = 765; // distancia segura o para el color blanco
, height : number = image.height()
, width : number = image.width()
, X : number = 0
, Y : number = 0
, Z : number = 765
;
*/
  private _debug    :boolean = false;
  private _dirGCode :string ='myGcode.gcode';
  private _dirImg   :string;
  private _img      :lwip.Image;
  private _gCode    :Line[];
  private _height   :number;
  private _width    :number;

  constructor(dirImg :string) {
    this._dirImg = dirImg;
    this._dirGCode = dirImg.substring(0,dirImg.lastIndexOf("."))+'.gcode';
    lwip.open(dirImg, function(err, image) {
      this._img = image;
      this._height = image.height();
      this._width = image.width();
    });
  }
  /**
   * getPixel
   * 
   * @private
   * @param {number} left
   * @param {number} top
   * @returns {Pixel}
   */
  private getPixel(left :number, top :number) : Pixel {
    let pixel = this._img.getPixel(left,top);
    let intensity = (pixel.r + pixel.g + pixel.b) * ((pixel.a > 1) ? pixel.a/100 : 1);
    return { colour: pixel, intensity : intensity , axes : {x:left,y:top} }
  }

  /**
   * addPixel
   * 
   * @private
   * @param {Pixel} pixel
   * @param {boolean} [show] default true
   * @param {string} [coment]
  */
  private addPixel(pixel :Pixel, show ?:boolean, coment ?:string) :void {
    this._gCode.push( new Line(show?show:true,pixel,coment) );
  }
  /**
   * pixelToGCode
   * 
   * @private
   * @param {Pixel} oldPixel
   * @param {Pixel} newPixel
   */
  private pixelToGCode(oldPixel :Pixel, newPixel :Pixel) {
    let index : number = this._gCode.length!==0 ? this._gCode.length-1 : 0 ;
    let gCodeLast : Line = this._gCode[index];
    if(this._debug) console.log(index,"->",gCodeLast);
    // White to Black
    if ( oldPixel.intensity > newPixel.intensity ) {
      // Z en otro linea
      if ( !(newPixel.axes.x - gCodeLast.axes.x === 1 || newPixel.axes.y - gCodeLast.axes.y === 1) ){
        // es cuando el pixel esta liejos de esta posision
        // maxZ o capas oldPixel.intensity
        newPixel.axes.z = oldPixel.intensity; // copas Zmas porque esta en otra liena
        this.addPixel(newPixel);
      }
      // primero al pixel negro , con Z anterior
      this.addPixel({
        axes : { x : newPixel.axes.x, y : newPixel.axes.y },
        colour : newPixel.colour,
        intensity : newPixel.intensity,
      })
      // depues bajar
      this.addPixel({
        axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
        colour : newPixel.colour,
        intensity : newPixel.intensity,
      })
    }
    // Black to White
    if ( oldPixel.intensity < newPixel.intensity ) {
      this.addPixel({
        axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
        colour : newPixel.colour,
        intensity : newPixel.intensity,
      })
    }
    // Black to Black
    if ( newPixel.intensity == 0 && oldPixel.intensity == newPixel.intensity ) {
      // ver bien para otros colores y para analisis con mmMax mmMin
      this.addPixel({
        axes : { x : newPixel.axes.x, y : newPixel.axes.y, z : newPixel.intensity },
        colour : newPixel.colour,
        intensity : newPixel.intensity,
      })
    }
  }
  /**
   * nextBlackPixel
   * 
   * @private
   * @param {Pixel} oldPixel
   * @returns {Pixel}
   */
  private nextBlackPixel(oldPixel :Pixel) :Pixel {
    let axes :number[] = [1,-1] // unida sumadas para pixel cercanos
      , newPixel :{ pixel :Pixel, be :boolean }  
      , next :boolean = true
    ;
    for (let i = 0; i < axes.length && next ; i++) {
      for (let j = 0; j < axes.length && next ; j++) {
        let px : number = oldPixel.axes.x + axes[i]
          , py : number = oldPixel.axes.y + axes[j]
        ;
        // pixel cercannos
        if( px>=0 && py>=0 && py <= this._width && px <= this._height ){
          let pixel :Pixel = this.getPixel(px,py);
          if( pixel.intensity < 765 ){
            newPixel = { pixel , be : false};
            // for para el GCode
            for (let index = 0; index < this._gCode.length; index++) {
              let e = this._gCode[index].axes;
              // el primer pixel que no este en el code
              // true && true -> pixel esta
              newPixel.be = ( e.x === newPixel.pixel.axes.x && e.y === newPixel.pixel.axes.y);
            }
            next = newPixel.be;
          }else{
            // guardar pixel seguientes y no negros ??
            this.addPixel(pixel,false)
          }
        }
      }
    }
    return newPixel.pixel;
  }
  /**
   * unprocessedPixel
   * 
   * @private
   * @returns {Pixel}
   */
  private unprocessedPixel() :Pixel {
    let next   :boolean = true
      , pixel : Pixel
    ;
    for (let y = 0; y < this._height && next; ++y) {
      for (let x = 0; x < this._width && next; ++x) {
        pixel = this.getPixel(x,y);
        next = false; // asumo que no esta
        let toBe = false; // Is pixel in gCode ?
        for (let i = 0; i < this._gCode.length && !toBe ; i++) {
          let e = this._gCode[i].axes;
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
  public main(top ?:number, left ?:number) {
    // add pixel 0,0 o por el primero.
    let oldPixel :Pixel = this.getPixel(0,0);
    // nuevo pixel blanco o siguiente
    let newPixel :Pixel = this.nextBlackPixel(oldPixel);
    if( newPixel === undefined || null ){  // este y (1) los anide por si separo los if capas que resuelve jutos
      newPixel = this.unprocessedPixel();
      if( newPixel === undefined || null ){ // (1)
        this.pixelToGCode(oldPixel,newPixel);
        oldPixel = newPixel;
      }else{
        new File().save(this._dirGCode,this._gCode,()=>{
          console.log("guardar :D");
        })
      }
    }else{
      this.pixelToGCode(oldPixel,newPixel);
      oldPixel = newPixel;
    }
  }
}

let img2gcode = new ImgToGCode("./img/25x25.png");
img2gcode.main();
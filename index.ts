type pixelAxes = { colour:lwip.ColorObject,  axes:axes };
type axes = {x:number, y:number, z?:number };

import Line from "./line";
import File from "./file";
import * as lwip  from 'lwip' ;

const dir : string = './img/25x25';
const dirImg : string = dir+'.png';
const dirGCode : string = dir+'.gcode';
const maxZ : number = 765; // distancia segura o para el color blanco
/**
 * @param  {pixel} pixel pixel
 * @returns number intencidad de 0-765
 */
function intensity( pixel: lwip.ColorObject ):number {
  let a = (pixel.a > 1) ? pixel.a/100 : 1;
  return (pixel.r + pixel.g + pixel.b) * a;
}
/**
 * @param  {pixel} p1 pixel anterior
 * @param  {pixel} p2 pixel actual
 */
function pixelToG(gCode:Line[],oldPixel:pixelAxes, newPixel:pixelAxes) {
  let iOld : number = intensity(oldPixel.colour)
    , iNew : number = intensity(newPixel.colour)
  ;
  let index : number = gCode.length!==0 ? gCode.length-1 : 0 ;
  let gCodeLast : Line = gCode[index];
  //console.log(index,"->",gCodeLast);
  // White to Black
  if ( iOld > iNew ) {
    // Z en otro linea
    if ( !(newPixel.axes.x - gCodeLast.axes.x === 1 || newPixel.axes.y - gCodeLast.axes.y === 1) ){
      gCode.push( new Line(true, {z:iOld} ,newPixel.colour ) ); // maxZ o capas i1
    }
    let axes :axes = { x : newPixel.axes.x, y : newPixel.axes.y }
    gCode.push( new Line(true, axes , newPixel.colour ) );
    gCode.push( new Line(true, {x : newPixel.axes.x, y : newPixel.axes.y, z:iNew} ,newPixel.colour ) );
  }
  // Black to White
  if ( iOld < iNew ) {
    gCode.push( new Line(true, {z:iNew} ,newPixel.colour ) );
  }
  // Black to Black
  if ( iNew == 0 && iOld == iNew ) {
     // ver bien para otros colores y para analisis con mmMax mmMin
    let axes :axes = {x : newPixel.axes.x, y : newPixel.axes.y,z:iNew }
    gCode.push( new Line(true, axes , newPixel.colour ) );
  }
}

function pixelAround(image:lwip.Image,gCode:Line[],oldPixel:pixelAxes) : pixelAxes {
  let axes : number[] = [1,-1] // unida sumadas para pixel cercanos
    , pixel : { colour : lwip.ColorObject , axes : axes , be : boolean}
    , next : boolean = true
  ;
  for (let i = 0; i < axes.length && next ; i++) {
    for (let j = 0; j < axes.length && next ; j++) {
      let px : number = oldPixel.axes.x + axes[i]
        , py : number = oldPixel.axes.y + axes[j]
      ;
      // pixel cercannos
      if( px>=0 && py>=0 && py <= image.width() && px <= image.height() ){
        let colour : lwip.ColorObject = image.getPixel(px,py);
        if( intensity(colour) < 765 ){
          pixel = { colour , axes : {x : px , y : py } , be : false};
          // for para el GCode
          for (let index = 0; index < gCode.length; index++) {
            let e = gCode[index].axes;
            // el primer pixel que no este en el code
            // true && true -> pixel esta
            pixel.be = e.x === pixel.axes.x && e.y === pixel.axes.y;
          }
          next = pixel.be;
        }
      }
    }
  }
  return pixel;
}

function unprocessedPixel(image:lwip.Image,gCode: Line[]) :pixelAxes {
  let height :number = image.height()
    , width  :number = image.width()
    , next   :boolean = true
    , pixel : pixelAxes
  ;
  for (let y = 0; y < height && next; ++y) {
    for (let x = 0; x < width && next; ++x) {
      pixel = {
        colour : image.getPixel(x,y),
        axes : { x , y }
      }
      // esta en gCode ?
      let toBe = true;
      for (let i = 0; i < gCode.length && toBe ; i++) {
        let e = gCode[i].axes;
        // el primero que no este aca
        if( e.x === x && e.y === y){
          next = false; // pixel isn't -> pixel found
        }else{
          toBe = false; // ! (esta) -> for gCode finsh to next pixel
        }
      }
    }
  }
  return pixel;
}

function pixelAnalysis(image:lwip.Image)  {
  // 0,0 -> (3) nextPixel -> (1)blanco? (si) x+1 < W and  y+1 < H (2): (no) + gCode and nextPixel (1)
  // (2) X=W and Y=H -> for gcode -> quedo? (si) :D : (no) (3)
  return new Promise(function (resolve, reject) {
    let gCode : Line[] = []
      , height : number = image.height()
      , width : number = image.width()
      , X : number = 0
      , Y : number = 0
      , Z : number = 765
    ;
    // linea inicial con Z intensity y pixel old
    let oldPixel : pixelAxes = { colour:image.getPixel(X,Y) , axes:{x:X,y:Y} }
    gCode.push( new Line(true, { x:oldPixel.axes.x, y:oldPixel.axes.y, z:intensity(oldPixel.colour) },oldPixel.colour, `Initial line X,Y and ${X},${Y}`) );

    // pixelSiguiente
    let newPixel : pixelAxes = pixelAround(image,gCode,oldPixel);

    if( intensity(newPixel.colour) == 765 ){ // no tengo pixel negro para seguir
      // si 
      // add with show false and new X and Y
      X = newPixel.axes.x;
      Y = newPixel.axes.y;
      Z = intensity(newPixel.colour);
      gCode.push( new Line(false, { x:X, y:Y, z:Z },newPixel.colour,'flase') );
      // buscar otro pixel que no este en gcode
      unprocessedPixel(image,gCode);

    }else{
      // no
      
    }


    // siguiente pixel
    // let newPixel : pixelAxes = pixelAround(image,gCode,oldPixel);
    // pixelToG(gCode,oldPixel,newPixel);



  resolve(gCode);   
  })
};

function main(dirImg:string,dirGCode:string) {
    lwip.open(dirImg, function(err, image){
      pixelAnalysis(image).then((gCode:Line[])=>{
        new File().Save(dirGCode,gCode,()=>{
          console.log(dirImg,'=to=>',dirGCode);
        });
      });
    });
}
main(dirImg,dirGCode);

/*
class Startup {
    public static test():void{
lwip.open('./img/rbgw.png', function(err, image){
  console.log('0,0', image.getPixel(0,0), intensity(image.getPixel(0,0)) );
  console.log('2,0', image.getPixel(2,0), intensity(image.getPixel(2,0)) );
  console.log('1,2', image.getPixel(2,1), intensity(image.getPixel(2,1)) );
  pixelAnalysis(image);
});
    }
}
Startup.test();
*/
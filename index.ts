interface pixelAxes {
  colour:pixel;
  axes:axes;
}
interface pixel {
  r:number; g:number; b:number; a:number;
}
interface axes {
  x:number; y:number; z?:number;
}

import Line from "./line";
import * as fs from "fs";
const lwip = require('lwip');

const dir : string = './img/25x25';
const dirImg : string = dir+'.png';
const dirGCode : string = dir+'.gcode';

/**
 * @param  {pixel} pixel pixel
 * @returns number intencidad de 0-765
 */
function intensity( pixel: pixel ):number {
  let a = (pixel.a > 1) ? pixel.a/100 : 1;
  return (pixel.r + pixel.g + pixel.b) * a;
}
/**
 * @param  {pixel} p1 pixel anterior
 * @param  {pixel} p2 pixel actual
 */
function pixelToG(gCode:Line[],pixelOld:pixelAxes, pixelNew:pixelAxes) {
  let iOld : number = intensity(pixelOld.colour)
    , iNew : number = intensity(pixelNew.colour)
    , maxZ : number = 765 // distancia segura o para el color blanco
  ;
  let index : number = gCode.length!==0 ? gCode.length-1 : 0 ;
  let gCodeLast : Line = gCode[index];
  //console.log(index,"->",gCodeLast);
  // White to Black
  if ( iOld > iNew ) {
    // Z en otro linea
    if ( !(pixelNew.axes.x - gCodeLast.axes.x === 1 || pixelNew.axes.y - gCodeLast.axes.y === 1) ){
      gCode.push( new Line( {z:iOld} ,pixelNew.colour ) ); // maxZ o capas i1
    }
    let axes :axes = { x : pixelNew.axes.x, y : pixelNew.axes.y }
    gCode.push( new Line( axes , pixelNew.colour ) );
    gCode.push( new Line( {x : pixelNew.axes.x, y : pixelNew.axes.y, z:iNew} ,pixelNew.colour ) );
  }
  // Black to White
  if ( iOld < iNew ) {
    gCode.push( new Line( {z:iNew} ,pixelNew.colour ) );
  }
  // Black to Black
  if ( iNew == 0 && iOld == iNew ) {
     // ver bien para otros colores y para analisis con mmMax mmMin
    let axes :axes = {x : pixelNew.axes.x, y : pixelNew.axes.y,z:iNew }
    gCode.push( new Line( axes , pixelNew.colour ) );
  }
}

function pixelAnalysis(image)  {
 return new Promise(function (resolve, reject){
  let gCode : Line[] = []
    , height = image.height()
    , width = image.width()
    , pixelOld : pixelAxes = {colour:image.getPixel(0, 0),axes:{x:0,y:0} }
  ;
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      let p = image.getPixel(x, y);
      let pixelNew = {  axes:{ x , y } ,colour :{ r:p.r , g:p.g , b:p.b , a:p.a }};
      if( !(x==0 && y==0) ){
        pixelToG(gCode,pixelOld,pixelNew);
        pixelOld = pixelNew;
      }else{
        gCode.push( new Line({x:pixelNew.axes.x,y:pixelNew.axes.y,z:maxZ},pixelNew.colour, "Initial line") );
      }
    }
  }
  resolve(gCode);   
  })
};


function main(dirImg:string,dirGCode:string) {
    fs.unlink(dirGCode);
    lwip.open(dirImg, function(err, image){
      pixelAnalysis(image).then((gCode:Line[])=>{
        toFile(gCode,dirGCode);
        console.log(dirImg,'=to=>',dirGCode);
      });
    });
}
main(dirImg,dirGCode);

function toFile(gCode: Line[],dirGCode:string) {
  fs.writeFile(dirGCode, concat(gCode).join('\n'),{ encoding: "utf8" },(err)=>{
    if(err) throw err.message;
  });
}
function concat(gCode: Line[]):string[] {
  let data : string[]= [
    'G21 ; Set units to mm',
    'G90 ; Absolute positioning'
  ]
  for (let index = 0; index < gCode.length; index++) {
    let element = gCode[index];
    data.push( element.code() );
  }
  return data;
}


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
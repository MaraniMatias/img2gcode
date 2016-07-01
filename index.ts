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
const img : string = './img/5x5.png';
const maxZ : number = 765;
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
function pixelToG(gCode:Line[],p1:pixelAxes, p2:pixelAxes) {
  // Z no esta bien calibrado
  // intensity
  let i1 = intensity(p1.colour)
    , i2 = intensity(p2.colour)
    , maxZ = 765 // distancia segura o para el blanco
  ;
  // White to Black
  if ( i1 > i2 ) {
    // Z en otro linea 
    let axes :axes = {x : p2.axes.x, y : p2.axes.y }
    gCode.push( new Line(axes,p2.colour ) )
    gCode.push( new Line( {z:i2} ,p2.colour ) )
  }
  // Black to White
  if ( i1 < i2 ) {
    gCode.push( new Line( {z:i2} ,p2.colour ) )
  }
  // Black to Black
  if ( i1 == 0 && i1 == i2 ) { // creo que no seria 0, verlo bien para otros colores y para analisis con mmMax mmMin
    let axes :axes = {x : p2.axes.x, y : p2.axes.y }
    gCode.push( new Line(axes,p2.colour ) )
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
      if( !(x==0 && y==0) ){
        let p = image.getPixel(x, y);
        let pixelNew = { colour :{ r:p.r , g:p.g , b:p.b , a:p.a }, axes:{ x , y } };
        pixelToG(gCode,pixelOld,pixelNew);
        pixelOld = pixelNew;
      }
    }
  }
  resolve(gCode);   
  })
};


function main(img:string) {
  fs.unlink("./img/myCodeG.gcode");
  lwip.open(img, function(err, image){
    pixelAnalysis(image).then((gCode:Line[])=>{
      toFile(gCode);
      console.log(__dirname+"/img/myCodeG.gcode");
    });
  });

}
main(img);


function toFile(gCode: Line[]) {
  let data : string[] = concat(gCode);
  for (let index = 0; index < data.length; index++) {
    let lineG = data[index];
console.log(lineG);
    fs.appendFile("./img/myCodeG.gcode", lineG+'\n',{encoding:"utf8"} ,(err)=>{
      if(err) throw err;
    })
  }
}
function concat(gCode: Line[]):string[] {
  let data : string[]= [
    'G21 ; Set units to mm',
    'G90 ; Absolute positioning',
    `G01 X0 Y0 Z${maxZ} ; Initial line`
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
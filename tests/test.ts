import * as img2gcode  from '../src/index.js';
console.log(__dirname+'/img-and-gcode/test.jpeg');

img2gcode({  // It is mm
  toolDiameter:4,
  scaleAxes: 700,
  totalStep: 1,
  deepStep: -1,
  whiteZ: 0,
  blackZ: -2,
  sevaZ: 2,
  dirImg:__dirname+'/img-and-gcode/test.jpeg'
}).then((data) => {
  //console.log(data.config.imgSize);
  //console.log(data.dirgcode);  
});

//add progress bar
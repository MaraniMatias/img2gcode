import * as img2gcode  from '../lib/index.js';

img2gcode({  // It is mm
  toolDiameter:4,
  scaleAxes: 700,
  totalStep: 1,
  deepStep: -1,
  whiteZ: 0,
  blackZ: -2,
  sevaZ: 2,
  dirImg:'../test/test.jpeg'
}).then((data) => {
  console.log(data.config.imgSize);
  //console.log(data.dirgcode);  
});

//add progress bar
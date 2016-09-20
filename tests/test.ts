import * as img2gcode  from '../src/index.js';

console.time('img2gcode');
img2gcode({  // It is mm
  toolDiameter: 1,
  scaleAxes: 700,
  deepStep: -1,
  whiteZ: 0,
  blackZ: -2,
  sevaZ: 1,
  dirImg: __dirname + '/img-and-gcode/test.png'
}).then((data) => {
  //console.log(data.config);
  //console.log(data.dirgcode);
  //console.log("eror:", data.config.errBlackPixel);
  console.timeEnd('img2gcode');
});

//add progress bar
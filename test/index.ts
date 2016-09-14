import * as img2gcode  from '../lib/index.js';

img2gcode({  // It is mm
  toolDiameter: 2,
  scaleAxes: 400,
  totalStep: 1,
  deepStep: -1,
  whiteZ: 0,
  blackZ: -2,
  sevaZ: 2,
  dirImg:'./test-200.png'
}).then((data) => {
  console.log(data.config);
  console.log(data.dirgcode);
});

//add progress bar
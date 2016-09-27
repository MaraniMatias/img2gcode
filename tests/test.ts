import * as img2gcode from '../src/index.js';
import * as ProgressBar  from 'progress';
var bar = new ProgressBar('Analyze: [:bar] :percent :etas', { width: 50, total: 100 });

console.time('img2gcode');

img2gcode
  .start({  // It is mm
    toolDiameter: 1,
    scaleAxes: 700,
    deepStep: -1,
    whiteZ: 0,
    blackZ: -2,
    sevaZ: 1,
    info: "emitter", // ["none" | "console" | "emitter"] default: "none"
    dirImg: __dirname + '/img-and-gcode/test.png'
  })
  .on('log', (str) => {
    console.log(str);
  })
  .on('tick', (data) => {
    bar.update(data)
  })
  .on('error', (err) => {
    console.error(err);
  })
  .on('complete', (data) => {
    //console.log(data.config);
    //console.log(data.dirgcode);
    console.log('complete');
  })
  .then((data) => {
    //console.log(data.config);
    //console.log(data.dirgcode);
    console.timeEnd('img2gcode');
  });

// 46365,7246ms
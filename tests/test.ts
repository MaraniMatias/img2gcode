import * as img2gcode from '../src/index.js';
import * as ProgressBar  from 'progress';
var bar = new ProgressBar('Analyze: [:bar] :percent :etas', { width: 50, total: 100 });

console.time('img2gcode');

img2gcode
  .start({  // It is mm
    toolDiameter: 4,
    scaleAxes: 700, // default: image.height equal mm
    deepStep: -1, // default: -1
    whiteZ: 0, // default: 0
    blackZ: -1,
    safeZ: 1,
    info: "emitter", // ["none" | "console" | "emitter"] default: "none"
    dirImg: __dirname + '/img-and-gcode/ok.jpeg'
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
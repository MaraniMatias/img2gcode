import * as img2gcode from '../src/index.js';
import * as ProgressBar  from 'progress';
var bar = new ProgressBar('Analyze: [:bar] :percent :etas', {
  complete: '#',
  incomplete: '.',
  width: 60,
  total: 100
});

console.time('img2gcode');

img2gcode
  .start({  // It is mm
    toolDiameter: 3,
    sensitivity: 0.95, // intensity sensitivity
    //scaleAxes: 500, // default: image.height equal mm
    //feedrate: { work: 1200, idle: 3000 }, // Only the corresponding line is added.
    deepStep: -1, // default: -1
    whiteZ: 0, // default: 0
    blackZ: -2,
    safeZ: 1,
    info: "emitter", // ["none" | "console" | "emitter"] default: "none"
    //dirImg: __dirname + '/img-and-gcode/pingui.png'
    dirImg: __dirname + "/img-and-gcode/kity.gif"
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
    console.log(data.config);
    //console.log(data.dirgcode);
    console.log('complete');
  })
  .then((data) => {
    //console.log(data.config);
    //console.log(data.dirgcode);
    console.timeEnd('img2gcode');
  });
  // 3227,8

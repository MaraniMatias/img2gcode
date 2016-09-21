import * as img2gcode from '../src/index.js';
import * as ProgressBar  from 'progress';
var bar = new ProgressBar('Analyze: [:bar] :percent :etas', { complete: '=', incomplete: ' ', width: 50, total: 100 })

console.time('img2gcode');

img2gcode
  .start({  // It is mm
    toolDiameter: 1,
    scaleAxes: 700,
    deepStep: -1,
    whiteZ: 0,
    blackZ: -2,
    sevaZ: 1,
    dirImg: __dirname + '/img-and-gcode/test.png'
  });

img2gcode
  .on('tick', (data) => {
    bar.update(data)
  })
  .on('error', (err) => {
    console.error(err);
  })
  .on('complete', (data) => {
    //console.log(data.config);
    //console.log(data.dirgcode);
    //console.log("eror:", data.config.errBlackPixel);
    console.timeEnd('img2gcode');
  });
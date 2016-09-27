import * as img2gcode from '../src/index.js';
import * as ProgressBar  from 'progress';
var bar = new ProgressBar('Analyze: [:bar] :percent :etas', { width: 50, total: 100 });

/**
 * name
 */
class SpeedTest {
  private testImplement: Function;
  private testParams: any;
  private repertitions: number;
  private average: number = 0;

  constructor(testImplement: Function, testParams?: any, repertitions?: number) {
    this.repertitions = repertitions || 1;
    this.testImplement = testImplement;
    this.testParams = testParams;
  }

  public startTest() {
    let beginTime, endTins, sumTims = 0;
    for (let i = 0, x = this.repertitions; i < x; i++) {
      beginTime = +new Date();
      if (this.testParams) this.testImplement(this.testParams);
      else this.testImplement();
      endTins = +new Date();
      sumTims = endTins - beginTime;
    }
    this.average = sumTims / this.repertitions;
    console.log("Test:", this.testImplement.name, 'in', this.average, 'ms');
  }
}

function i2g() {
  img2gcode.start({
    toolDiameter: 1,
    scaleAxes: 700,
    deepStep: -1,
    whiteZ: 0,
    blackZ: -2,
    sevaZ: 1,
    info: "console", // ["none" | "console" | "emitter"] default: "none"
    dirImg: __dirname + '/img-and-gcode/test.png'
  })
    .on('log', (str) => {
      console.log(str);
    })
    .on('tick', (data) => {
      bar.update(data)
    })
}

new SpeedTest(i2g).startTest();


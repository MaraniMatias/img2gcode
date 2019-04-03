/*eslint no-console: "warn"*/
const path = require("path");
const img2gcode = require("../src");
const ProgressBar = require("progress");
var bar = new ProgressBar("Analyze: [:bar] :percent :etas", {
  complete: "#",
  incomplete: ".",
  width: 60,
  total: 100
});


// const imgFile = "/img-and-gcode/482.png";
// const imgFile = "/img-and-gcode/emprendevs.png";
const imgFile = "/img-and-gcode/master.png";
// const imgFile = "/img-and-gcode/pingui.jpeg";
// const imgFile = "/img-and-gcode/pingui.png";
// const imgFile = "/img-and-gcode/qutap.png";
// const imgFile = "/img-and-gcode/test.jpeg";
// const imgFile = "/img-and-gcode/test.png";

console.time("img2gcode");
img2gcode
  .start({
    // It is mm
    toolDiameter: 3,
    sensitivity: 0.9, // intensity sensitivity
    scaleAxes: 128, // default: image.height equal mm
    feedrate: { work: 1200, idle: 3000 }, // Only the corresponding line is added.
    deepStep: -1, // default: -1
    // invest: {x:true, y: false},
    whiteZ: 0, // default: 0
    blackZ: -3,
    safeZ: 1,
    info: "emitter", // ["none" | "console" | "emitter"] default: "none"
    dirImg: path.normalize(__dirname + imgFile)
  })
  .on("log", str => {
    console.log(str);
  })
  .on("tick", data => {
    bar.update(data);
  })
  .on("error", err => {
    console.error(err);
  })
  .on("complete", data => {
    console.log(data.config);
    //console.log(data.dirgcode);
    console.log("complete");
  })
  .then(data => {
    // console.log(data.config);
    // console.log(data.dirgcode);
    console.timeEnd("img2gcode");
  });

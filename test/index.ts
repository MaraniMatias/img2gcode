import img2gcode  from '../lib/index';

img2gcode({  // It is mm
    toolDiameter: 2,
    scaleAxes: 700,
    totalStep: 1,
    deepStep: -1,
    whiteZ: 0,
    blackZ: -2,
    sevaZ: 2,
    dirImg:'./test.png'
});
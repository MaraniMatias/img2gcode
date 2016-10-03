# Image to gCode
Convert jpg, png, gif to gcode  with NodeJS and [lwip](https://www.npmjs.com/package/lwip#installation).

- Generate GCode with absolute coordinates, finds a black pixel if you follow the trail.
- This version is faster previous versions.
- If you like my work you can help me, thank you so much. [![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=273U85DLFL3F6)

### Installation
```bash
$ npm install img2gcode
```

## Quick Start
Depending on the configuration between tool and image height generates better code.

```Javascript
var img2gcode = require("img2gcode");

  img2gcode({  // It is mm
    toolDiameter: 2,
    scaleAxes: 700,
    deepStep: -1,
    whiteZ: 0,
    blackZ: -2,
    safeZ: 2,
    dirImg:__dirname+'/img-and-gcode/test.jpeg'
  }).then((data) => {
    console.log(data.config);
    console.log(data.dirgcode);
  });
```

### Options
- `toolDiameter` (number) Tool diameter.
- `sensitivity` (number) Intensity sensitivity. 0 to 1. **default:** 0.95
- `scaleAxes` (number)  Image height in mm. **default:** image.height equal mm
- `deepStep` (number) Depth per pass. **default:** -1
- `dirImg` (string) Image path, accepts JPG PNG GIF formats.
- `whiteZ` (number) White pixels. **default:** 0
- `blackZ` (number) Maximum depth (Black pixels).
- `safeZ` (number) Safe distance.
- `info` (string) Displays information. ["none" | "console" | "emitter"] **default:** none

### Events
  Only if Options.info it is "emitter"
- `log` Displays information.
- `tick` Percentage of black pixels processed. 0 (0%) to 1 (100%).
- `error` Displays error.
- `complete` Emits at the end with "then".

### Method
- `then`
  This function is called to finish saving the file GCode.
  Receives as parameters an object: { config , dirgcode }

### Examples

```Javascript
var img2gcode = require("img2gcode");
var ProgressBar = require("progress"); // npm install progress
var bar = new ProgressBar('Analyze: [:bar] :percent :etas', { total: 100 });

img2gcode
  .start({  // It is mm
    toolDiameter: 1,
    scaleAxes: 700,
    deepStep: -1,
    whiteZ: 0,
    blackZ: -2,
    safeZ: 1,
    info: "emitter", // "none" or "console" or "emitter"
    dirImg: __dirname + '/img-and-gcode/test.png'
  })
  .on('log', (str) => {
    console.log(str);
  })
  .on('tick', (perc) => {
    bar.update(perc)
  })
  .then((data) => {
    console.log(data.dirgcode);
  });
```

![img2gcode with CNC-ino](https://github.com/MaraniMatias/img2gcode/blob/master/ej-img2gcode.jpeg)

### Version.
- `0.1.8`: Solving some errors when changing scale.
- `0.1.7`: Solution for images with black border.
- `0.1.6`: Improvement in the way of how to follow the trail of black pixels.
- `0.1.5`: Improves evaluate distance between points with larger diameters tool 2.
- `0.1.4`: Improved search of black pixels nearby. Print time GCode.

### License.
I hope someone else will serve ([MIT](http://opensource.org/licenses/mit-license.php)).

Author: Marani Matias Ezequiel.
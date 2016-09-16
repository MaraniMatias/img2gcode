# image to gcode
convert jpg, png,gif to gcode  with nodejs and [lwip](https://www.npmjs.com/package/lwip#installation).

```Javascript
var img2gcode = require("img2gcode");

  img2gcode({  // It is mm
    toolDiameter: 2,
    scaleAxes: 700,
    deepStep: -1,
    whiteZ: 0,
    blackZ: -2,
    sevaZ: 2,
    dirImg:__dirname+'/img-and-gcode/test.jpeg'
  }).then((data) => {
    console.log(data.config);
    console.log(data.dirgcode);
  });
```

## Licencia.
Espero que alguien más le sirva ([MIT](http://opensource.org/licenses/mit-license.php)).
Autor:
Marani Matias E.
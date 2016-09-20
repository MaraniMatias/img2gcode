import Utilities from "./utilities";
import Analyze from "./analyze";
import Line from "./line";
import File from "./file";
import * as lwip  from 'lwip';
import * as ProgressBar  from 'progress';
var
  _gCode: imgToCode.Line[] = [],
  _img: imgToCode.Image = {
    width: 0,
    height: 0,
    pixels: []
  },
  _pixel = {
    toMm: 1, // 1 pixel es X mm
    diameter: 1
  },
  bar = new ProgressBar('-> [:bar] :percent :etas', { complete: '=', incomplete: ' ', width: 50, total: 100 })
  ;
/**
 * It is mm
 *@param {
 *  toolDiameter: 2,
 *  scaleAxes: 40,
 *  deepStep: -1,
 *  whiteZ: 0,
 *  blackZ: -2,
 *  sevaZ: 2,
 *  dirImg:'./img/test.png',
 *  imgSize:''
 *} It is mm
 */
function start(config: imgToCode.config): Promise<{ data: imgToCode.startPromise }> {
  return new Promise(function (fulfill, reject) {
    try {
      console.log("-> Image: ", config.dirImg);//, "\nconfig:", config);
      let self = this;
      return new Promise(function (fulfill, reject) {
        lwip.open(config.dirImg, function (err: Error, image) {
          if (err) throw new Error(err.message);

          _img.height = image.height();
          _img.width = image.width();
          _img.pixels = getAllPixel(image);

          _pixel.toMm = Utilities.round(config.scaleAxes / _img.height);
          _pixel.diameter = Utilities.round(config.toolDiameter / _pixel.toMm);

          config.errBlackPixel = Utilities.size(_img.pixels);
          config.imgSize = `(${_img.height},${_img.width})pixel to (${Utilities.round(_img.height * _pixel.toMm)},${Utilities.round(_img.width * _pixel.toMm)})mm`
          fulfill(config);
        });
      })
        .then((config: imgToCode.config) => {
          analyze(config, (dirgcode: string) => {
            fulfill({ dirgcode, config });
          });
        });

    } catch (err) {
      throw new Error(err);
      //reject(err);
    }
  })
}

function analyze(config: imgToCode.config, fulfill: (dirGCode: string) => void) {
  try {
    let firstPixel: imgToCode.Pixel[][] = Analyze.getFirstPixel(_img, _pixel);
    addPixel({
      x: firstPixel[0][0].axes.x,
      y: firstPixel[0][0].axes.y
    }, config.sevaZ);

    let w = 0;
    while (w <= config.errBlackPixel) {
      bar.update(w / config.errBlackPixel);
      let nexPixels = Analyze.nextBlackToMove(firstPixel, _img, _pixel);
      if (!nexPixels) {
        config.errBlackPixel = Utilities.round(Utilities.size(_img.pixels) * 100 / config.errBlackPixel);
        if (!bar.complete) bar.update(1);
        console.log(`-> ${config.errBlackPixel}% of black pixels unprocessed.`);
        console.log("-> Accommodating gcode...");
        new File().save(_gCode, config).then((dirGCode: string) => {
          console.log("-> Sava As:", dirGCode);
          fulfill(dirGCode);
        });
        break;
      }
      firstPixel = toGCode(firstPixel, nexPixels, config.sevaZ);
      w++;
    }
  } catch (error) {
    throw new Error(`Analyze\n ${error}`);
  }
}

function toGCode(oldPixel: imgToCode.Pixel[][], newPixel: imgToCode.Pixel[][], sevaZ: number): imgToCode.Pixel[][] {
  try {
    let pixelLast = newPixel[0][0], pixelFist = oldPixel[0][0];
    if (Utilities.distanceIsOne(oldPixel, newPixel)) {
      addPixel({
        x: pixelFist.axes.x + (pixelLast.axes.x - pixelFist.axes.x),
        y: pixelFist.axes.y + (pixelLast.axes.y - pixelFist.axes.y),
        z: false//config.blackZ
      });
    } else {
      addPixel({
        z: sevaZ
      });
      addPixel({
        x: pixelFist.axes.x + (pixelLast.axes.x - pixelFist.axes.x),
        y: pixelFist.axes.y + (pixelLast.axes.y - pixelFist.axes.y),
        z: sevaZ
      });
      addPixel({
        z: false//config.blackZ
      });
    }

    Utilities.appliedAllPixel(newPixel, (p: imgToCode.Pixel) => { p.be = true; });
    return newPixel;
  } catch (error) {
    console.error("oldPixel", oldPixel, "\nnewPixel", newPixel, 'error:\n', error);
    throw new Error("Pixels are not valid for this configuration.")
  }
}

function addPixel(axes: imgToCode.Axes, sevaZ?: number | boolean) {
  try {
    let sum = _pixel.diameter / 2;
    let X = axes.x ? (axes.x + sum) * _pixel.toMm : undefined;
    let Y = axes.y ? (axes.y + sum) * _pixel.toMm : undefined;
    if (_gCode.length === 0) {
      _gCode.push(new Line({ x: 0, y: 0, z: sevaZ }, `X0 Y0 Z${sevaZ} Line Init`));
      _gCode.push(new Line({ x: X, y: Y, z: sevaZ }, 'With Z max '));
    }
    _gCode.push(new Line({ x: X, y: Y, z: axes.z }));
  } catch (error) {
    throw new Error('AddPixel > G01 ' + axes.x ? `X${axes.x ? (axes.x + _pixel.diameter / 2) * _pixel.toMm : undefined}` : '' + axes.y ? `Y${axes.x ? (axes.x + _pixel.diameter / 2) * _pixel.toMm : undefined}` : '' + axes.z !== undefined ? `Z${axes.z};` : ';' + `\n ${error}`);
  }
}

/**
 * @param {lwip.Image} image
 * @returns {Pixel[][]}
 */
function getAllPixel(image: lwip.Image): imgToCode.Pixel[][] {
  try {
    function intensityFix(colour: lwip.ColorObject) {
      return (colour.r + colour.g + colour.b) * ((colour.a > 1) ? colour.a / 100 : 1) < 10 ? 0 : 765;
    }
    let newArray = [];
    for (let x = 0; x < image.width(); x++) {
      let row = []
      for (let y = 0; y < image.height(); y++) {
        let intensity = intensityFix(image.getPixel(x, y));
        row.push({ axes: { x, y }, intensity, be: intensity !== 0 });
      }
      newArray.push(row);
    }
    return newArray;
  } catch (error) {
    throw error;
  }
}

export = start
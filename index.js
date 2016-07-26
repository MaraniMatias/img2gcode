"use strict";
var line_1 = require("./line");
var lwip = require('lwip');
var _log = {
    nextBlackPixel: false,
    pixelToGCode: false,
    pixelAround: false,
    addPixel: !false,
    main: false
};
var _dirGCode = 'myGcode.gcode';
var _dirImg;
var _img;
var _gCode = [];
var _height = 0;
var _width = 0;
function getPixel(left, top) {
    var pixel = _img.getPixel(left, top);
    var intensity = (pixel.r + pixel.g + pixel.b) * ((pixel.a > 1) ? pixel.a / 100 : 1);
    return { colour: pixel, intensity: intensity, axes: { x: left, y: top } };
}
function addPixel(pixel, show, coment) {
    var index = _gCode.push(new line_1.default(show === undefined ? true : show, pixel, coment));
    if (_log.addPixel && (show === undefined)) {
        console.log(_gCode[index - 1].code());
    }
    return pixel;
}
function pixelToGCode(oldPixel, newPixel) {
    if (_log.pixelToGCode) {
        console.log("pixelToGCode\noldPixel ->\n", oldPixel.axes, "\nnewPixel ->\n", newPixel.axes);
    }
    if (oldPixel.intensity > newPixel.intensity) {
        if (!(newPixel.axes.x - oldPixel.axes.x === 1 || newPixel.axes.y - oldPixel.axes.y === 1)) {
            newPixel.axes.z = oldPixel.intensity;
            addPixel(newPixel);
        }
        addPixel({
            axes: { x: newPixel.axes.x, y: newPixel.axes.y },
            colour: newPixel.colour,
            intensity: oldPixel.intensity
        });
        addPixel({
            axes: { x: newPixel.axes.x, y: newPixel.axes.y, z: newPixel.intensity },
            colour: newPixel.colour,
            intensity: newPixel.intensity
        });
    }
    else if (oldPixel.intensity < newPixel.intensity) {
        addPixel({
            axes: { x: oldPixel.axes.x, y: oldPixel.axes.y, z: oldPixel.intensity },
            colour: oldPixel.colour,
            intensity: newPixel.intensity
        });
        addPixel({
            axes: { x: newPixel.axes.x, y: newPixel.axes.y, z: newPixel.intensity },
            colour: newPixel.colour,
            intensity: newPixel.intensity
        }, false);
    }
    else if (newPixel.intensity < 765 && oldPixel.intensity === newPixel.intensity) {
        addPixel({
            axes: { x: newPixel.axes.x, y: newPixel.axes.y },
            colour: newPixel.colour,
            intensity: newPixel.intensity
        });
        addPixel({
            axes: { x: newPixel.axes.x, y: newPixel.axes.y, z: newPixel.intensity },
            colour: newPixel.colour,
            intensity: newPixel.intensity
        });
    }
    else {
        addPixel(newPixel, false);
    }
    return newPixel;
}
function isPixelnGCode(pixel) {
    for (var index = 0; index < _gCode.length; index++) {
        if (_gCode[index].axes.x === pixel.axes.x && _gCode[index].axes.y === pixel.axes.y) {
            return true;
        }
    }
}
function pixelAround(axes, oldPixel) {
    var pixels = [];
    for (var i = 0; i < axes.length; i++) {
        for (var j = 0; j < axes.length; j++) {
            var x = oldPixel.axes.x + axes[i], y = oldPixel.axes.y + axes[j];
            if ((x >= 0 && y >= 0) && (y < _width && x < _height)) {
                if (_log.pixelAround) {
                    console.log("pixelAround:", "x:", x, "y:", y);
                }
                pixels.push(getPixel(x, y));
            }
            if (i + 1 == axes.length && j + 1 == axes.length)
                return pixels;
        }
    }
}
function unprocessedPixel() {
    var next = true, pixel;
    for (var y = 0; y < _height && next; ++y) {
        for (var x = 0; x < _width && next; ++x) {
            pixel = getPixel(x, y);
            next = false;
            var toBe = false;
            for (var i = 0; i < _gCode.length && !toBe; i++) {
                var e = _gCode[i].axes;
                if (e.x === x && e.y === y) {
                    toBe = true;
                    next = true;
                }
            }
        }
    }
    return pixel;
}
function mani(top, left) {
    var oldPixel = addPixel(getPixel(0, 0), true, "---> pixel start <---");
    var totalPixel = _height * _width;
    for (var x = 0; x < _height; x++) {
        for (var y = 0; y < _width; y++) {
            var newPixel = nextBlackPixel(oldPixel);
            oldPixel = pixelToGCode(lasPixelGCode(), newPixel ? newPixel : unprocessedPixel());
        }
    }
}
function lasPixelGCode() {
    for (var index = _gCode.length - 1; index >= 0; index--) {
        if (_gCode[index].show) {
            return {
                axes: _gCode[index].axes,
                colour: _gCode[index].colour,
                intensity: _gCode[index].intensity
            };
        }
    }
}
function nextBlackPixel(oldPixel) {
    var axesAround = [0, 1, -1], newPixel;
    var pixelsA = pixelAround(axesAround, oldPixel);
    for (var index = 0; index < pixelsA.length; index++) {
        var pixel = pixelsA[index];
        if (pixel.intensity < 765) {
            if (!isPixelnGCode(pixel)) {
                if (_log.nextBlackPixel) {
                    console.log("nextBlackPixel:", pixel);
                }
                return pixel;
            }
        }
        else {
            addPixel(pixel, false);
        }
    }
}
function start(dirImg) {
    _dirImg = dirImg;
    _dirGCode = dirImg.substring(0, dirImg.lastIndexOf(".")) + '.gcode';
    lwip.open(_dirImg, function (err, image) {
        _height = image.height();
        _width = image.width();
        _img = image;
        mani();
    });
}
start("./img/130x130.png");

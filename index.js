"use strict";
var line_1 = require("./line");
var lwip = require('lwip');
var _log = true;
var _dirGCode = 'myGcode.gcode';
var _dirImg;
var _img;
var _gCode = [];
var _height = 0;
var _width = 0;
var self = this;
function getPixel(left, top) {
    var pixel = _img.getPixel(left, top);
    var intensity = (pixel.r + pixel.g + pixel.b) * ((pixel.a > 1) ? pixel.a / 100 : 1);
    return { colour: pixel, intensity: intensity, axes: { x: left, y: top } };
}
function addPixel(pixel, show, coment) {
    _gCode.push(new line_1.default(show ? show : true, pixel, coment));
}
function pixelToGCode(oldPixel, newPixel) {
    var index = _gCode.length !== 0 ? _gCode.length - 1 : 0;
    var gCodeLast = _gCode[index];
    if (_log)
        console.log(index, "->", gCodeLast);
    if (oldPixel.intensity > newPixel.intensity) {
        if (!(newPixel.axes.x - gCodeLast.axes.x === 1 || newPixel.axes.y - gCodeLast.axes.y === 1)) {
            newPixel.axes.z = oldPixel.intensity;
            addPixel(newPixel);
        }
        addPixel({
            axes: { x: newPixel.axes.x, y: newPixel.axes.y },
            colour: newPixel.colour,
            intensity: newPixel.intensity,
        });
        addPixel({
            axes: { x: newPixel.axes.x, y: newPixel.axes.y, z: newPixel.intensity },
            colour: newPixel.colour,
            intensity: newPixel.intensity,
        });
    }
    if (oldPixel.intensity < newPixel.intensity) {
        addPixel({
            axes: { x: newPixel.axes.x, y: newPixel.axes.y, z: newPixel.intensity },
            colour: newPixel.colour,
            intensity: newPixel.intensity,
        });
    }
    if (newPixel.intensity == 0 && oldPixel.intensity == newPixel.intensity) {
        addPixel({
            axes: { x: newPixel.axes.x, y: newPixel.axes.y, z: newPixel.intensity },
            colour: newPixel.colour,
            intensity: newPixel.intensity,
        });
    }
}
function nextBlackPixel(oldPixel) {
    var axesAround = [0, 1, -1], newPixel;
    var pixelsA = pixelAround(axesAround);
    for (var index = 0; index < pixelsA.length; index++) {
        var pixel = pixelsA[index];
        if (pixel.intensity < 765) {
            if (!isPixelnGCode(pixel)) {
                return pixel;
            }
        }
        else {
            addPixel(pixel, false);
        }
        if (index + 1 == pixelsA.length) {
            return undefined;
        }
    }
    function isPixelnGCode(pixel) {
        for (var index = 0; index < _gCode.length; index++) {
            var toBe = false;
            if (index == _gCode.length || toBe) {
                return toBe;
            }
            else {
                toBe = (_gCode[index].axes.x === pixel.axes.x && _gCode[index].axes.y === pixel.axes.y);
            }
        }
    }
    function pixelAround(axes) {
        var pixels = [];
        for (var i = 0; i < axes.length; i++) {
            for (var j = 0; j < axes.length; j++) {
                var x = oldPixel.axes.x + axes[i], y = oldPixel.axes.y + axes[j];
                if ((x >= 0 && y >= 0) && (y <= _width && x <= _height)) {
                    pixels.push(getPixel(x, y));
                }
                if (i + 1 == axes.length && j + 1 == axes.length)
                    return pixels;
            }
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
function main(top, left) {
    var oldPixel = getPixel(top, left);
    console.log(nextBlackPixel(oldPixel));
}
function start(dirImg, top, left) {
    _dirImg = dirImg;
    _dirGCode = dirImg.substring(0, dirImg.lastIndexOf(".")) + '.gcode';
    lwip.open(_dirImg, function (err, image) {
        _height = image.height();
        _width = image.width();
        _img = image;
        main(top != undefined ? top : 0, left != undefined ? left : 0);
    });
}
start("./img/25x25.png", 4, 2);

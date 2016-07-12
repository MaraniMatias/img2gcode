"use strict";
var line_1 = require("./line");
var file_1 = require("./file");
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
    var axes = [1, -1], newPixel = {}, next = true;
    for (var i = 0; i < axes.length && next; i++) {
        for (var j = 0; j < axes.length && next; j++) {
            var px = oldPixel.axes.x + axes[i], py = oldPixel.axes.y + axes[j];
            if (px >= 0 && py >= 0 && py <= _width && px <= _height) {
                var pixel = getPixel(px, py);
                if (pixel.intensity < 765) {
                    newPixel = { pixel: pixel, be: false };
                    for (var index = 0; index < _gCode.length; index++) {
                        var e = _gCode[index].axes;
                        newPixel.be = (e.x === newPixel.pixel.axes.x && e.y === newPixel.pixel.axes.y);
                    }
                    next = newPixel.be;
                }
                else {
                    addPixel(pixel, false);
                }
            }
        }
    }
    return newPixel.pixel;
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
    var oldPixel = getPixel(top != undefined ? top : 0, left != undefined ? left : 0);
    var newPixel = nextBlackPixel(oldPixel);
    if (newPixel === undefined || null) {
        newPixel = unprocessedPixel();
        if (newPixel === undefined || null) {
            pixelToGCode(oldPixel, newPixel);
            oldPixel = newPixel;
        }
        else {
            new file_1.default().save(_dirGCode, _gCode, function () {
                console.log("guardar :D");
            });
        }
    }
    else {
        pixelToGCode(oldPixel, newPixel);
        oldPixel = newPixel;
    }
}
function start(dirImg) {
    _dirImg = dirImg;
    _dirGCode = dirImg.substring(0, dirImg.lastIndexOf(".")) + '.gcode';
    lwip.open(_dirImg, function (err, image) {
        _height = image.height();
        _width = image.width();
        _img = image;
        main();
    });
}
start("./img/25x25.png");

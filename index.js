"use strict";
var line_1 = require("./line");
var lwip = require('lwip');
var _log = {
    nextBlackPixel: false,
    pixelToGCode: false,
    pixelAround: false,
    removePixel: false,
    getAllPixel: false,
    addPixel: !false,
    main: false,
    size: false
};
var _dirGCode = 'myGcode.gcode';
var _dirImg;
var _gCode = [];
var _height = 0;
var _width = 0;
var _img = [];
function getAllPixel(image) {
    if (_log.getAllPixel) {
        console.log("_width:", _width, "_height:", _height);
    }
    var newArray = [];
    for (var x = 0; x < _width; x++) {
        var row = [];
        for (var y = 0; y < _height; y++) {
            var colour = image.getPixel(x, y);
            var intensity = (colour.r + colour.g + colour.b) * ((colour.a > 1) ? colour.a / 100 : 1);
            row.push({ colour: colour, axes: { x: x, y: y }, intensity: intensity });
        }
        newArray.push(row);
    }
    return newArray;
}
function getPixel(left, top) {
    return _img[left][top];
}
function addPixel(pixel, show, coment) {
    var index = _gCode.push(new line_1.default(show === undefined ? true : show, pixel, coment));
    if (_log.addPixel && (show === undefined)) {
        console.log(_gCode[index - 1].code());
    }
    removePixel(pixel.axes.x, pixel.axes.y);
    return pixel;
}
function removePixel(left, top) {
    if (_log.removePixel) {
        console.log("removePixel:\n", "left:", left, "top:", top, _img[left][top]);
    }
    if (_img[left][top]) {
        delete _img[left][top];
    }
    else {
        if (_log.removePixel)
            console.log("It isn't:", left, top);
    }
    return _img;
}
function size(arr) {
    var size = 0;
    if (_log.size) {
        console.log(arr.length * arr[arr.length - 1].length);
    }
    for (var x = 0; x < arr.length; x++) {
        var arrX = arr[x];
        for (var y = 0; y < arrX.length; y++) {
            if (arrX[y])
                size++;
        }
    }
    return size;
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
            if ((x >= 0 && y >= 0) && (y < _width && x < _height) && !(oldPixel.axes.x == x && oldPixel.axes.y == y)) {
                var p = getPixel(x, y);
                if (_log.pixelAround) {
                    console.log("pixelAround:", "x:", x, "y:", y, "\npixel:", p);
                }
                if (p != undefined) {
                    pixels.push(p);
                }
                else {
                    if (_log.pixelAround) {
                        console.log("(" + x + "," + y + ") -> " + getPixel(x, y));
                    }
                }
            }
        }
    }
    return pixels;
}
function unprocessedPixel() {
    for (var x = 0; x < _img.length; x++) {
        for (var y = 0; y < _img[x].length; y++) {
            if (_img[x][y]) {
                return getPixel(x, y);
            }
        }
    }
}
function mani(top, left) {
    var oldPixel = addPixel(getPixel(0, 0), true, "---> pixel start <---");
    var s = size(_img);
    for (var i = 0; i < s; i++) {
        if (_log.size) {
            console.log("size", size(_img));
        }
        var newPixel = nextBlackPixel(oldPixel);
        oldPixel = pixelToGCode(lasPixelGCode(), newPixel ? newPixel : unprocessedPixel());
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
    if (_log.nextBlackPixel) {
        console.log("nextBlackPixel:\n\toldPixel:", oldPixel);
    }
    var axesAround = [0, 1, -1], pixelsA = pixelAround(axesAround, oldPixel);
    if (_log.nextBlackPixel) {
        console.log("pixelsA:", pixelsA);
    }
    for (var index = 0; index < pixelsA.length; index++) {
        if (_log.nextBlackPixel) {
            console.log("pixelsA[" + index + "]:", pixelsA[index].axes);
        }
        if (_log.nextBlackPixel) {
            console.log("nextBlackPixel:", pixelsA[index]);
        }
        if (pixelsA[index].intensity < 765) {
            return pixelsA[index];
        }
    }
}
function start(dirImg) {
    _dirImg = dirImg;
    _dirGCode = dirImg.substring(0, dirImg.lastIndexOf(".")) + '.gcode';
    lwip.open(_dirImg, function (err, image) {
        if (err)
            console.log(err.message);
        _height = image.height();
        _width = image.width();
        _img = getAllPixel(image);
        mani();
    });
}
start("./img/line-v.png");

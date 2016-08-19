"use strict";
var lwip = require('lwip');
var _log = {
    getFirstPixel: false,
    getAllPixel: false,
    start: false,
    main: false,
    size: false
};
var _dirGCode = 'myGcode.gcode';
var _dirImg;
var _gCode = [];
var _height = 0;
var _width = 0;
var _img = [];
var config = {
    toolDiameter: 2,
};
start("./img/test.png");
function start(dirImg) {
    console.log("->", dirImg);
    _dirImg = dirImg;
    _dirGCode = dirImg.substring(0, dirImg.lastIndexOf(".")) + '.gcode';
    lwip.open(_dirImg, function (err, image) {
        if (err)
            console.log(err.message);
        _height = image.height();
        _width = image.width();
        _img = getAllPixel(image);
        if (_log.start) {
            console.log("_height", _height, "_width", _width);
        }
        if (_log.getAllPixel) {
            console.log("_img:", _img);
        }
        main();
    });
}
function getAllPixel(image) {
    var newArray = [];
    for (var x = 0; x < _width; x++) {
        var row = [];
        for (var y = 0; y < _height; y++) {
            var colour = image.getPixel(x, y);
            var intensity = (colour.r + colour.g + colour.b) * ((colour.a > 1) ? colour.a / 100 : 1);
            row.push({ axes: { x: x, y: y }, intensity: intensity });
        }
        newArray.push(row);
    }
    return newArray;
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
function getFirstPixel() {
    for (var x = 0; x < _img.length; x++) {
        for (var y = 0; y < _img[x].length; y++) {
            if (_log.main) {
                console.log("for " + x + "," + y + " -> " + _img[x][y].axes.x + "," + _img[x][y].axes.y + " -> " + _img[x][y].intensity);
            }
            var pixels = [];
            if (x + config.toolDiameter < _width && y + config.toolDiameter < _height && _img[x][y] && _img[x][y].intensity < 765) {
                for (var x2 = 0; x2 < config.toolDiameter; x2++) {
                    var row = [];
                    for (var y2 = 0; y2 < config.toolDiameter; y2++) {
                        var p = _img[x + x2 < _width ? x + x2 : _width][y + y2 < _height ? y + y2 : _height];
                        if (p.intensity < 765) {
                            row.push(p);
                        }
                        else {
                            break;
                        }
                    }
                    pixels.push(row);
                }
                if (size(pixels) === config.toolDiameter * 2) {
                    return pixels;
                }
            }
            else {
                if (_log.getFirstPixel)
                    console.log((x + config.toolDiameter) + "< " + _width + " && " + (y + config.toolDiameter) + "<" + _height + " && " + _img[x][y].intensity + " < 765");
            }
        }
    }
}
function main() {
    var firstPixel = getFirstPixel();
    nextBlackToMove(firstPixel);
}
getFirstPixel;
function toGCode(pixels) {
}
function unprocessedPixelBelowTool() {
    var pixelBelowTool = [];
    var pixelWhite = 0;
    for (var x = 0; x < _img.length; x++) {
        for (var y = 0; y < _img[x].length; y++) {
            if (_img[x][y]) {
                for (var x2 = 0; x2 < config.toolDiameter; x2++) {
                    var row = [];
                    for (var y2 = 0; y2 < config.toolDiameter; y2++) {
                        var p = _img[x + x2 < _width ? x + x2 : _width][y + y2 < _height ? y + y2 : _height];
                        if (p.intensity === 765) {
                            pixelWhite++;
                            if (pixelWhite > config.toolDiameter * 2) {
                                console.log("muchos blancos");
                            }
                        }
                        row.push(p);
                    }
                    pixelBelowTool.push(row);
                }
            }
            return pixelBelowTool;
        }
    }
}
function nextBlackToMove(oldPixelBlack) {
    console.log(0, oldPixelBlack[0][0].axes);
    console.log(0, oldPixelBlack[0][1].axes);
    console.log(1, oldPixelBlack[1][0].axes);
    console.log(1, oldPixelBlack[1][1].axes);
    for (var iX = 0; iX < oldPixelBlack.length; iX++) {
        var element = oldPixelBlack[iX][0];
        console.log("axes", element.axes, "x,y-1 (", element.axes.x, element.axes.y - 1, ")");
    }
    for (var iColumn = 0; iColumn < oldPixelBlack[0].length; iColumn++) {
        var element = oldPixelBlack[0][iColumn];
        console.log("axes", element.axes, "x-1,y (", element.axes.x - 1, element.axes.y, ")");
    }
    for (var iRow = 0; iRow < oldPixelBlack[oldPixelBlack.length - 1].length; iRow++) {
        var element = oldPixelBlack[oldPixelBlack.length - 1][iRow];
        console.log("axes", element.axes, "x+1,y (", element.axes.x + 1, element.axes.y, ")");
    }
    for (var iY = 0; iY < oldPixelBlack[0].length; iY++) {
        var element = oldPixelBlack[iY][oldPixelBlack[0].length - 1];
        console.log("axes", element.axes, "x,y+1 (", element.axes.x, element.axes.y + 1, ")");
    }
}

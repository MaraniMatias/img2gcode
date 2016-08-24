"use strict";
var lwip = require('lwip');
var _log = {
    nextBlackToMove: false,
    getFirstPixel: false,
    getAllPixel: false,
    lookAt: false,
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
    console.log('G21 ; Set units to mm');
    console.log('G90 ; Absolute positioning');
    console.log('G01 X0 Y0 Z765; con Z max');
    var firstPixel = getFirstPixel();
    addPixel(firstPixel[0][0].axes);
    var nexPixels = nextBlackToMove(firstPixel);
    toGCode(firstPixel, nexPixels);
}
function toGCode(oldPixel, newPixel) {
    var pixelToMm = 1;
    var pixelFist = newPixel[newPixel.length - 1][newPixel[newPixel.length - 1].length - 1];
    var pixelLast = oldPixel[0][0];
    addPixel({ x: pixelFist.axes.x - pixelLast.axes.x, y: pixelFist.axes.y - pixelLast.axes.y });
}
function addPixel(axes) {
    var pixelToMm = 1;
    var X = axes.x + config.toolDiameter / 2;
    var Y = axes.y + config.toolDiameter / 2;
    console.log("G01 X" + X + " Y" + Y, axes.z ? "Z" + axes.z : '');
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
function lootAtUp(oldPixelBlack) {
    var pixels = [];
    for (var iX = 0; iX < oldPixelBlack.length; iX++) {
        var e = oldPixelBlack[iX][0];
        var pixel = _img[e.axes.x][e.axes.y - 1];
        if (pixel)
            pixels.push(pixel);
        if (_log.lookAt) {
            console.log("axes", e.axes, "x,y-1", pixel.axes);
        }
    }
    return pixels;
}
function lootAtLeft(oldPixelBlack) {
    var pixels = [];
    for (var iColumn = 0; iColumn < oldPixelBlack[0].length; iColumn++) {
        var e = oldPixelBlack[0][iColumn];
        var pixel = _img[e.axes.x - 1][e.axes.y];
        if (pixel)
            pixels.push(pixel);
        if (_log.lookAt) {
            console.log("axes", e.axes, "x-1,y", pixel.axes);
        }
    }
    return pixels;
}
function lootAtDown(oldPixelBlack) {
    var pixels = [];
    for (var iY = 0; iY < oldPixelBlack[0].length; iY++) {
        var e = oldPixelBlack[iY][oldPixelBlack[0].length - 1];
        var pixel = _img[e.axes.x][e.axes.y + 1];
        if (pixel)
            pixels.push(pixel);
        if (_log.lookAt) {
            console.log("axes", e.axes, "x,y+1", pixel.axes);
        }
    }
    return pixels;
}
function lootAtRight(oldPixelBlack) {
    var pixels = [];
    for (var iRow = 0; iRow < oldPixelBlack[oldPixelBlack.length - 1].length; iRow++) {
        var e = oldPixelBlack[oldPixelBlack.length - 1][iRow];
        var pixel = _img[e.axes.x + 1][e.axes.y];
        if (pixel)
            pixels.push(pixel);
        if (_log.lookAt) {
            console.log("axes", e.axes, "x+1,y", pixel.axes);
        }
    }
    return pixels;
}
function AllBlack(oldPixelBlack) {
    var answer = true;
    for (var x = 0; x < oldPixelBlack.length; x++) {
        if (oldPixelBlack[x].intensity === 765) {
            answer = false;
        }
        ;
    }
    return answer;
}
function nextBlackToMove(oldPixelBlack) {
    var plootAtUp = lootAtUp(oldPixelBlack);
    var plootAtLeft = lootAtLeft(oldPixelBlack);
    var plootAtRight = lootAtRight(oldPixelBlack);
    var plootAtDown = lootAtDown(oldPixelBlack);
    var arrPixel = [];
    if (AllBlack(plootAtUp)) {
        if (_log.nextBlackToMove)
            console.log("plootAtUp\n", plootAtUp);
        for (var iRow = 0; iRow < oldPixelBlack.length; iRow++) {
            var row = [];
            row.push(plootAtUp[iRow]);
            for (var iColumn = 0; iColumn < oldPixelBlack[iRow].length - 1; iColumn++) {
                row.push(oldPixelBlack[iRow][iColumn]);
            }
            arrPixel.push(row);
        }
    }
    else if (AllBlack(plootAtLeft)) {
        if (_log.nextBlackToMove)
            console.log("plootAtLeft\n", plootAtLeft);
        arrPixel.push(plootAtLeft);
        for (var iRow = oldPixelBlack.length - 1; iRow > 0; iRow--) {
            var e_1 = oldPixelBlack[iRow];
            arrPixel.push(e_1);
        }
    }
    else if (AllBlack(plootAtRight)) {
        if (_log.nextBlackToMove)
            console.log("plootAtRight\n", plootAtRight);
        for (var iRow = 1; iRow < oldPixelBlack.length; iRow++) {
            var e_2 = oldPixelBlack[iRow];
            arrPixel.push(e_2);
        }
        arrPixel.push(plootAtRight);
    }
    else if (AllBlack(plootAtDown)) {
        if (_log.nextBlackToMove)
            console.log("plootAtDown\n", plootAtDown);
        for (var iRow = 0; iRow < oldPixelBlack.length; iRow++) {
            var row = [];
            for (var iColumn = 1; iColumn < oldPixelBlack[iRow].length; iColumn++) {
                row.push(oldPixelBlack[iRow][iColumn]);
            }
            row.push(plootAtDown[iRow]);
            arrPixel.push(row);
        }
    }
    else {
        console.log("buscar por otro lado");
    }
    if (_log.nextBlackToMove) {
        for (var ix = 0; ix < arrPixel.length; ix++) {
            for (var iy = 0; iy < arrPixel[ix].length; iy++) {
                var e = arrPixel[ix][iy];
                console.log(ix, iy, "e", e.axes, "inte", e.intensity);
            }
        }
    }
    return arrPixel;
}

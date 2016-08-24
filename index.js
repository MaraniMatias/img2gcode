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
            row.push({ axes: { x: x, y: y }, intensity: intensity, be: false });
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
    var i = 0;
    while (i < 3) {
        var nexPixels = nextBlackToMove(firstPixel);
        toGCode(firstPixel, nexPixels);
        firstPixel = nexPixels;
        i++;
    }
}
function toGCode(oldPixel, newPixel) {
    var pixelToMm = 1;
    var pixelFist = newPixel[newPixel.length - 1][newPixel[newPixel.length - 1].length - 1];
    var pixelLast = oldPixel[0][0];
    addPixel({
        x: pixelFist.axes.x - pixelLast.axes.x,
        y: pixelFist.axes.y - pixelLast.axes.y
    });
    appliedAllPixel(oldPixel, function (p) { p.be = true; });
}
function addPixel(axes) {
    var pixelToMm = 1;
    var X = axes.x + config.toolDiameter / 2;
    var Y = axes.y + config.toolDiameter / 2;
    console.log("G01 X" + X + " Y" + Y, axes.z ? "Z" + axes.z : '');
}
function appliedAllPixel(p, cb) {
    for (var iRow = 0; iRow < p.length; iRow++) {
        for (var iColumn = 0; iColumn < p[iRow].length - 1; iColumn++) {
            cb(_img[iRow][iColumn], iRow, iColumn);
        }
    }
}
function unprocessedPixelBelowTool() {
    var pixelBelowTool = [];
    var pixelWhite = 0;
    for (var x = 0; x < _img.length; x++) {
        for (var y = 0; y < _img[x].length; y++) {
            if (_img[x][y].be) {
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
        if (oldPixelBlack[x].intensity === 765 || oldPixelBlack[x].be) {
            answer = false;
        }
        else {
            console.log("esta procesado o es blanco");
        }
        ;
    }
    return answer;
}
function nextBlackToMove(oldPixelBlack) {
    var PLootAtUp = lootAtUp(oldPixelBlack);
    var PLootAtLeft = lootAtLeft(oldPixelBlack);
    var PLootAtRight = lootAtRight(oldPixelBlack);
    var PLootAtDown = lootAtDown(oldPixelBlack);
    var arrPixel = [];
    if (AllBlack(PLootAtUp)) {
        if (_log.nextBlackToMove)
            console.log("PLootAtUp\n", PLootAtUp);
        for (var iRow = 0; iRow < oldPixelBlack.length; iRow++) {
            var row = [];
            row.push(PLootAtUp[iRow]);
            for (var iColumn = 0; iColumn < oldPixelBlack[iRow].length - 1; iColumn++) {
                row.push(oldPixelBlack[iRow][iColumn]);
            }
            arrPixel.push(row);
        }
    }
    else if (AllBlack(PLootAtLeft)) {
        if (_log.nextBlackToMove)
            console.log("PLootAtLeft\n", PLootAtLeft);
        arrPixel.push(PLootAtLeft);
        for (var iRow = oldPixelBlack.length - 1; iRow > 0; iRow--) {
            var e = oldPixelBlack[iRow];
            arrPixel.push(e);
        }
    }
    else if (AllBlack(PLootAtRight)) {
        if (_log.nextBlackToMove)
            console.log("PLootAtRight\n", PLootAtRight);
        for (var iRow = 1; iRow < oldPixelBlack.length; iRow++) {
            var e = oldPixelBlack[iRow];
            arrPixel.push(e);
        }
        arrPixel.push(PLootAtRight);
    }
    else if (AllBlack(PLootAtDown)) {
        if (_log.nextBlackToMove)
            console.log("PLootAtDown\n", PLootAtDown);
        for (var iRow = 0; iRow < oldPixelBlack.length; iRow++) {
            var row = [];
            for (var iColumn = 1; iColumn < oldPixelBlack[iRow].length; iColumn++) {
                row.push(oldPixelBlack[iRow][iColumn]);
            }
            row.push(PLootAtDown[iRow]);
            arrPixel.push(row);
        }
    }
    else {
        console.log("buscar por otro lado");
    }
    if (_log.nextBlackToMove) {
        appliedAllPixel(arrPixel, function (e, iRow, iColumn) {
            console.log(iRow, iColumn, "e", e.axes, "intensity", e.intensity);
        });
    }
    return arrPixel;
}

"use strict";
const lwip = require('lwip');
const _log = {
    nextBlackToMove: false,
    getFirstPixel: false,
    getAllPixel: false,
    AllBlack: false,
    toGCode: false,
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
    let newArray = [];
    for (let x = 0; x < _width; x++) {
        let row = [];
        for (let y = 0; y < _height; y++) {
            let colour = image.getPixel(x, y);
            let intensity = (colour.r + colour.g + colour.b) * ((colour.a > 1) ? colour.a / 100 : 1);
            row.push({ axes: { x: x, y: y }, intensity: intensity, be: false });
        }
        newArray.push(row);
    }
    return newArray;
}
function size(arr) {
    let size = 0;
    if (_log.size) {
        console.log(arr.length * arr[arr.length - 1].length);
    }
    for (let x = 0; x < arr.length; x++) {
        let arrX = arr[x];
        for (let y = 0; y < arrX.length; y++) {
            if (arrX[y])
                size++;
        }
    }
    return size;
}
function getFirstPixel() {
    for (let x = 0; x < _img.length; x++) {
        for (let y = 0; y < _img[x].length; y++) {
            if (_log.main) {
                console.log(`for ${x},${y} -> ${_img[x][y].axes.x},${_img[x][y].axes.y} -> ${_img[x][y].intensity}`);
            }
            let pixels = [];
            if (x + config.toolDiameter < _width && y + config.toolDiameter < _height && _img[x][y] && _img[x][y].intensity < 765) {
                for (let x2 = 0; x2 < config.toolDiameter; x2++) {
                    let row = [];
                    for (let y2 = 0; y2 < config.toolDiameter; y2++) {
                        let p = _img[x + x2 < _width ? x + x2 : _width][y + y2 < _height ? y + y2 : _height];
                        if (p.intensity < 765 && !p.be) {
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
                if (_log.getFirstPixel) {
                    console.log(`${x + config.toolDiameter}< ${_width} && 
          ${y + config.toolDiameter}<${_height} && 
          ${_img[x][y].intensity} < 765`);
                }
            }
        }
    }
}
function main() {
    console.log('G21 ; Set units to mm');
    console.log('G90 ; Absolute positioning');
    console.log('G01 X0 Y0 Z765; con Z max');
    let w = size(_img) / config.toolDiameter * 2;
    let firstPixel = getFirstPixel();
    addPixel(firstPixel[0][0].axes);
    while (w >= 0) {
        if (_log.main)
            console.log("firstPixel", '\n', firstPixel[0][0].axes, firstPixel[0][1].axes, '\n', firstPixel[1][0].axes, firstPixel[1][1].axes);
        let nexPixels = nextBlackToMove(firstPixel);
        if (_log.main)
            console.log("nexPixels", '\n', nexPixels[0][0].axes, nexPixels[0][1].axes, '\n', nexPixels[1][0].axes, nexPixels[1][1].axes);
        firstPixel = toGCode(firstPixel, nexPixels);
        w--;
    }
}
function toGCode(oldPixel, newPixel) {
    if (_log.toGCode) {
        console.log("firstPixel", '\n', oldPixel[0][0].axes, oldPixel[0][1].axes, '\n', oldPixel[1][0].axes, oldPixel[1][1].axes);
        console.log("nexPixels", '\n', newPixel[0][0].axes, newPixel[0][1].axes, '\n', newPixel[1][0].axes, newPixel[1][1].axes);
    }
    let pixelToMm = 1;
    let pixelFist = newPixel[newPixel.length - 1][newPixel[newPixel.length - 1].length - 1];
    let pixelLast = oldPixel[0][0];
    addPixel({
        x: pixelLast.axes.x + (pixelFist.axes.x - pixelLast.axes.x),
        y: pixelLast.axes.y + (pixelFist.axes.y - pixelLast.axes.y)
    });
    appliedAllPixel(oldPixel, (p) => { p.be = true; });
    return newPixel;
}
function addPixel(axes) {
    let pixelToMm = 1;
    let sum = config.toolDiameter / 2, X = axes.x + sum, Y = axes.y + sum;
    console.log(`G01 X${X} Y${Y}`, axes.z ? `Z${axes.z}` : '');
}
function appliedAllPixel(arr, cb) {
    for (let iRow = 0; iRow < arr.length; iRow++) {
        for (let iColumn = 0; iColumn < arr[iRow].length - 1; iColumn++) {
            cb(arr[iRow][iColumn], iRow, iColumn);
        }
    }
}
function lootAtUp(oldPixelBlack) {
    let pixels = [];
    for (let iX = 0; iX < oldPixelBlack.length; iX++) {
        let e = oldPixelBlack[iX][0];
        let pixel = _img[e.axes.x][e.axes.y - 1];
        if (pixel)
            pixels.push(pixel);
        if (_log.lookAt) {
            console.log("axes", e.axes, "x,y-1", pixel.axes);
        }
    }
    return pixels;
}
function lootAtLeft(oldPixelBlack) {
    let pixels = [];
    for (let iColumn = 0; iColumn < oldPixelBlack[0].length; iColumn++) {
        let e = oldPixelBlack[0][iColumn];
        let pixel = _img[e.axes.x - 1][e.axes.y];
        if (pixel)
            pixels.push(pixel);
        if (_log.lookAt) {
            console.log("axes", e.axes, "x-1,y", pixel.axes);
        }
    }
    return pixels;
}
function lootAtDown(oldPixelBlack) {
    let pixels = [];
    for (let iY = 0; iY < oldPixelBlack[0].length; iY++) {
        let e = oldPixelBlack[iY][oldPixelBlack[0].length - 1];
        let pixel = _img[e.axes.x][e.axes.y + 1];
        if (pixel)
            pixels.push(pixel);
        if (_log.lookAt) {
            console.log("axes", e.axes, "x,y+1", pixel.axes);
        }
    }
    return pixels;
}
function lootAtRight(oldPixelBlack) {
    let pixels = [];
    for (let iRow = 0; iRow < oldPixelBlack[oldPixelBlack.length - 1].length; iRow++) {
        let e = oldPixelBlack[oldPixelBlack.length - 1][iRow];
        let pixel = _img[e.axes.x + 1][e.axes.y];
        if (pixel)
            pixels.push(pixel);
        if (_log.lookAt) {
            console.log("axes", e.axes, "x+1,y", pixel.axes);
        }
    }
    return pixels;
}
function AllBlack(oldPixelBlack) {
    let answer = true;
    for (let x = 0; x < oldPixelBlack.length; x++) {
        if (oldPixelBlack[x].intensity === 765 || oldPixelBlack[x].be) {
            answer = false;
        }
        else {
            if (_log.AllBlack)
                console.log("AllBlack:\n\taxes:", oldPixelBlack[x].axes, "intensidad:", oldPixelBlack[x].intensity, "be", oldPixelBlack[x].be);
        }
        ;
    }
    return answer;
}
function nextBlackToMove(oldPixelBlack) {
    let PLootAtUp = lootAtUp(oldPixelBlack);
    let PLootAtLeft = lootAtLeft(oldPixelBlack);
    let PLootAtRight = lootAtRight(oldPixelBlack);
    let PLootAtDown = lootAtDown(oldPixelBlack);
    let arrPixel = [];
    if (AllBlack(PLootAtUp)) {
        if (_log.nextBlackToMove)
            console.log("PLootAtUp\n", PLootAtUp);
        for (let iRow = 0; iRow < oldPixelBlack.length; iRow++) {
            let row = [];
            row.push(PLootAtUp[iRow]);
            for (let iColumn = 0; iColumn < oldPixelBlack[iRow].length - 1; iColumn++) {
                row.push(oldPixelBlack[iRow][iColumn]);
            }
            arrPixel.push(row);
        }
    }
    else if (AllBlack(PLootAtLeft)) {
        if (_log.nextBlackToMove)
            console.log("PLootAtLeft\n", PLootAtLeft);
        arrPixel.push(PLootAtLeft);
        for (let iRow = oldPixelBlack.length - 1; iRow > 0; iRow--) {
            let e = oldPixelBlack[iRow];
            arrPixel.push(e);
        }
    }
    else if (AllBlack(PLootAtRight)) {
        if (_log.nextBlackToMove)
            console.log("PLootAtRight\n", PLootAtRight);
        for (let iRow = 1; iRow < oldPixelBlack.length; iRow++) {
            let e = oldPixelBlack[iRow];
            arrPixel.push(e);
        }
        arrPixel.push(PLootAtRight);
    }
    else if (AllBlack(PLootAtDown)) {
        if (_log.nextBlackToMove)
            console.log("PLootAtDown\n", PLootAtDown);
        for (let iRow = 0; iRow < oldPixelBlack.length; iRow++) {
            let row = [];
            for (let iColumn = 1; iColumn < oldPixelBlack[iRow].length; iColumn++) {
                row.push(oldPixelBlack[iRow][iColumn]);
            }
            row.push(PLootAtDown[iRow]);
            arrPixel.push(row);
        }
    }
    else {
        console.log("buscar por otro lado -> avanzar y buscar otro");
        arrPixel = getFirstPixel();
    }
    if (_log.nextBlackToMove) {
        appliedAllPixel(arrPixel, (e, iRow, iColumn) => {
            console.log(iRow, iColumn, "e", e.axes, "intensity", e.intensity, "be", e.be);
        });
    }
    return arrPixel;
}
//# sourceMappingURL=index.js.map
"use strict";
const line_1 = require("./line");
const file_1 = require("./file");
const lwip = require('lwip');
const _log = {
    appliedAllPixel: false,
    nextBlackToMove: false,
    getFirstPixel: false,
    distanceIsOne: false,
    getAllPixel: false,
    AllBlack: false,
    addPixel: false,
    toGCode: false,
    lookAt: false,
    start: false,
    main: false,
    size: false
};
var _gCode = [], _height = 0, _width = 0, _img = [], _pixel = {
    toMm: 1,
    diameter: 1
};
function start(config) {
    console.log("-> Imagen: ", config.dirImg, "\nconfig:", config);
    lwip.open(config.dirImg, function (err, image) {
        if (err)
            throw new Error(err.message);
        _height = image.height();
        _width = image.width();
        _img = getAllPixel(image);
        config.imgSize = `(${_height},${_width})`;
        _pixel.toMm = config.scaleAxes / _height;
        _pixel.diameter = config.toolDiameter / _pixel.toMm;
        if (_log.getAllPixel) {
            console.log("_img:", _img);
        }
        main(config);
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
            if (_log.getFirstPixel) {
                console.log(`for (${x},${y}) -> {${_img[x][y].axes.x},${_img[x][y].axes.y}} -> ${_img[x][y].intensity} --- ${_height},${_width} ${_pixel.diameter}`);
            }
            let pixels = [], diameter = _pixel.diameter < 1 ? 1 : Math.floor(_pixel.diameter);
            if (_log.getFirstPixel) {
                console.log(`[${x},${y}] x${x + _pixel.diameter} < ${_width} y${y + _pixel.diameter} < ${_height} -> ${_img[x][y].intensity}`);
            }
            if (x + _pixel.diameter <= _width && y + _pixel.diameter <= _height && _img[x][y].intensity < 765) {
                for (let x2 = 0; x2 < _pixel.diameter; x2++) {
                    let row = [];
                    for (let y2 = 0; y2 < _pixel.diameter; y2++) {
                        let countBlack = 0, p = _img[x + x2 < _height ? x + x2 : _height][y + y2 < _width ? y + y2 : _width];
                        if (p.intensity < 765) {
                            countBlack++;
                            if (countBlack > diameter || !p.be) {
                                row.push(p);
                            }
                        }
                    }
                    pixels.push(row);
                }
                if (pixels[0].length === diameter && pixels[pixels.length - 1].length === diameter) {
                    return pixels;
                }
            }
            else {
                if (_log.getFirstPixel) {
                    console.log(`${x + _pixel.diameter} < ${_width} && ${y + _pixel.diameter} < ${_height} && ${_img[x][y].intensity} < 765`);
                }
            }
        }
    }
}
function main(config) {
    try {
        let firstPixel = getFirstPixel();
        addPixel({
            x: firstPixel[0][0].axes.x,
            y: firstPixel[0][0].axes.y
        }, config.sevaZ);
        let w = size(_img) / _pixel.diameter;
        while (w > 0) {
            if (_log.main)
                console.log("firstPixel", '\n', firstPixel[0][0].axes, firstPixel[0][1].axes, '\n', firstPixel[1][0].axes, firstPixel[1][1].axes);
            let nexPixels = nextBlackToMove(firstPixel);
            if (_log.main)
                console.log("nexPixels", '\n', nexPixels[0][0].axes, nexPixels[0][1].axes, '\n', nexPixels[1][0].axes, nexPixels[1][1].axes);
            if (!nexPixels) {
                new file_1.default().save(_gCode, config, (dirGCode) => {
                    console.log("-> Sava As:", dirGCode);
                });
                break;
            }
            firstPixel = toGCode(firstPixel, nexPixels, config.sevaZ);
            w--;
        }
    }
    catch (error) {
        console.error(error);
    }
}
function toGCode(oldPixel, newPixel, sevaZ) {
    try {
        if (_log.toGCode) {
            console.log("firstPixel", '\n', oldPixel[0][0].axes, oldPixel[0][1].axes, '\n', oldPixel[1][0].axes, oldPixel[1][1].axes);
            console.log("nexPixels", '\n', newPixel[0][0].axes, newPixel[0][1].axes, '\n', newPixel[1][0].axes, newPixel[1][1].axes);
        }
        let pixelLast = newPixel[0][0], pixelFist = oldPixel[0][0];
        if (distanceIsOne(oldPixel, newPixel)) {
            addPixel({
                x: pixelFist.axes.x + (pixelLast.axes.x - pixelFist.axes.x),
                y: pixelFist.axes.y + (pixelLast.axes.y - pixelFist.axes.y),
                z: false
            });
        }
        else {
            addPixel({
                z: sevaZ
            });
            addPixel({
                x: pixelFist.axes.x + (pixelLast.axes.x - pixelFist.axes.x),
                y: pixelFist.axes.y + (pixelLast.axes.y - pixelFist.axes.y),
                z: sevaZ
            });
            addPixel({
                z: false
            });
        }
        appliedAllPixel(oldPixel, (p) => { p.be = true; });
        return newPixel;
    }
    catch (err) {
        console.error("oldPixel", oldPixel, "\nnewPixel", newPixel);
        throw new Error("pixels are not valid for this configuration.\n" + err);
    }
}
function addPixel(axes, sevaZ) {
    let sum = _pixel.diameter / 2;
    let X = axes.x ? (axes.x + sum) * _pixel.toMm : undefined;
    let Y = axes.y ? (axes.y + sum) * _pixel.toMm : undefined;
    if (_gCode.length === 0) {
        if (_log.addPixel)
            console.log('G01', axes.x ? `X${X}` : '', axes.y ? `Y${Y}` : '', `Z${sevaZ};`);
        _gCode.push(new line_1.default({ x: 0, y: 0, z: sevaZ }, `X0 Y0 Z${sevaZ} Line Init`));
        _gCode.push(new line_1.default({ x: X, y: Y, z: sevaZ }, 'With Z max '));
    }
    if (_log.addPixel)
        console.log('G01', axes.x ? `X${X}` : '', axes.y ? `Y${Y}` : '', axes.z !== undefined ? `Z${axes.z};` : ';');
    _gCode.push(new line_1.default({ x: X, y: Y, z: axes.z }));
}
function distanceIsOne(oldPixel, newPixel) {
    let arrNewPixel = Array();
    arrNewPixel.push(newPixel[newPixel.length - 1][newPixel[newPixel.length - 1].length - 1]);
    arrNewPixel.push(newPixel[0][0]);
    arrNewPixel.push(newPixel[0][newPixel[newPixel.length - 1].length - 1]);
    arrNewPixel.push(newPixel[newPixel.length - 1][0]);
    let arrOldPixel = Array();
    arrOldPixel.push(oldPixel[oldPixel.length - 1][oldPixel[oldPixel.length - 1].length - 1]);
    arrOldPixel.push(oldPixel[0][0]);
    arrOldPixel.push(oldPixel[0][oldPixel[oldPixel.length - 1].length - 1]);
    arrOldPixel.push(oldPixel[oldPixel.length - 1][0]);
    for (let ix = 0; ix < arrNewPixel.length; ix++) {
        let nPixel = arrNewPixel[ix];
        for (let iy = 0; iy < arrOldPixel.length; iy++) {
            let oPixel = arrOldPixel[iy];
            let disX = nPixel.axes.x - oPixel.axes.x;
            let disY = nPixel.axes.y - oPixel.axes.y;
            let sigX = disX > 0 ? 1 : -1;
            let sigY = disY > 0 ? 1 : -1;
            if (_log.distanceIsOne) {
                console.log("disX", disX, "disY", disY, "newPixel", nPixel.axes, "oldPixel", oPixel.axes, (disX === sigX && (disY === 0 || disY === sigY)) || (disY === sigY && (disX === 0 || disX === sigX)) || disY === 0 && disX === 0);
            }
            return (disX === sigX && (disY === 0 || disY === sigY)) ||
                (disY === sigY && (disX === 0 || disX === sigX)) ||
                disY === 0 && disX === 0;
        }
    }
}
function appliedAllPixel(arr, cb) {
    for (let iRow = 0; iRow < arr.length; iRow++) {
        if (_log.appliedAllPixel)
            console.log("iRow", iRow);
        if (arr[iRow].length === 1) {
            cb(arr[iRow][0], iRow);
        }
        for (let iColumn = 0; iColumn < arr[iRow].length - 1; iColumn++) {
            if (_log.appliedAllPixel)
                console.log("iColumn", iColumn);
            if (_log.appliedAllPixel)
                console.log(_img[arr[iRow][iColumn].axes.x][arr[iRow][iColumn].axes.y]);
            cb(arr[iRow][iColumn], iRow, iColumn);
        }
    }
}
function lootAtUp(oldPixelBlack) {
    let pixels = [];
    for (let iX = 0; iX < oldPixelBlack.length; iX++) {
        let e = oldPixelBlack[iX][0];
        if (e === undefined || e.axes.y === 0)
            break;
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
        if (e === undefined || e.axes.x === 0)
            break;
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
        if (e === undefined || e.axes.y === _width - 1)
            break;
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
        if (e === undefined || e.axes.x === _height - 1)
            break;
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
    if (oldPixelBlack[0] === undefined)
        return false;
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
    let arrPixel = [];
    let PLootAtUp = lootAtUp(oldPixelBlack);
    let PLootAtLeft = lootAtLeft(oldPixelBlack);
    let PLootAtRight = lootAtRight(oldPixelBlack);
    let PLootAtDown = lootAtDown(oldPixelBlack);
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
        arrPixel = getFirstPixel();
        if (_log.nextBlackToMove) {
            console.log("Avanzar y buscar con getFirstPixel.\nArrPixel:\n", arrPixel);
        }
    }
    if (_log.nextBlackToMove) {
        appliedAllPixel(arrPixel, (e, iRow, iColumn) => {
            console.log(iRow, iColumn, "e", e.axes, "intensity", e.intensity, "be", e.be);
        });
    }
    return arrPixel;
}
start({
    toolDiameter: 2,
    scaleAxes: 40,
    totalStep: 1,
    deepStep: -1,
    whiteZ: 0,
    blackZ: -2,
    sevaZ: 2,
    dirImg: './img/test.png',
    imgSize: ''
});
//# sourceMappingURL=index.js.map
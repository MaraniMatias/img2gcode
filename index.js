"use strict";
var line_1 = require("./line");
var fs = require("fs");
var lwip = require('lwip');
var maxZ = 765;
var dir = './img/5x5';
var dirImg = dir + '.png';
var dirGCode = dir + '.gcode';
function intensity(pixel) {
    var a = (pixel.a > 1) ? pixel.a / 100 : 1;
    return (pixel.r + pixel.g + pixel.b) * a;
}
function pixelToG(gCode, pixelOld, pixelNew) {
    var iOld = intensity(pixelOld.colour), iNew = intensity(pixelNew.colour), maxZ = 765;
    var index = gCode.length !== 0 ? gCode.length - 1 : 0;
    var gCodeLast = gCode[index];
    console.log(index, "->", gCodeLast);
    if (iOld > iNew) {
        if (!(pixelNew.axes.x - gCodeLast.axes.x === 1 || pixelNew.axes.y - gCodeLast.axes.y === 1)) {
            gCode.push(new line_1.default({ z: maxZ }, pixelNew.colour));
        }
        var axes = { x: pixelNew.axes.x, y: pixelNew.axes.y };
        gCode.push(new line_1.default(axes, pixelNew.colour));
        gCode.push(new line_1.default({ x: pixelNew.axes.x, y: pixelNew.axes.y, z: iNew }, pixelNew.colour));
    }
    if (iOld < iNew) {
        gCode.push(new line_1.default({ z: iNew }, pixelNew.colour));
    }
    if (iNew == 0 && iOld == iNew) {
        var axes = { x: pixelNew.axes.x, y: pixelNew.axes.y, z: iNew };
        gCode.push(new line_1.default(axes, pixelNew.colour));
    }
}
function pixelAnalysis(image) {
    return new Promise(function (resolve, reject) {
        var gCode = [], height = image.height(), width = image.width(), pixelOld = { colour: image.getPixel(0, 0), axes: { x: 0, y: 0 } };
        for (var y = 0; y < height; ++y) {
            for (var x = 0; x < width; ++x) {
                var p = image.getPixel(x, y);
                var pixelNew = { axes: { x: x, y: y }, colour: { r: p.r, g: p.g, b: p.b, a: p.a } };
                if (!(x == 0 && y == 0)) {
                    pixelToG(gCode, pixelOld, pixelNew);
                    pixelOld = pixelNew;
                }
                else {
                    gCode.push(new line_1.default({ x: pixelNew.axes.x, y: pixelNew.axes.y, z: maxZ }, pixelNew.colour, "Initial line"));
                }
            }
        }
        resolve(gCode);
    });
}
;
function main(dirImg, dirGCode) {
    new Promise(function (resolve, reject) {
        fs.unlink(dirGCode, function (err) {
            if (err) {
                fs.writeFile(dirGCode, "", function (err) {
                    resolve({});
                });
            }
            else {
                resolve({});
            }
        });
    }).then(function (data) {
        lwip.open(dirImg, function (err, image) {
            pixelAnalysis(image).then(function (gCode) {
                toFile(gCode, dirGCode);
                console.log(__dirname + dirGCode);
            });
        });
    }).catch(function (err) {
        console.log(err);
    });
}
main(dirImg, dirGCode);
function toFile(gCode, dirGCode) {
    var data = concat(gCode);
    for (var index = 0; index < data.length; index++) {
        var lineG = data[index];
        console.log(lineG);
        fs.appendFile(dirGCode, lineG + '\n', { encoding: "utf8" }, function (err) {
            if (err)
                throw err;
        });
    }
}
function concat(gCode) {
    var data = [
        'G21 ; Set units to mm',
        'G90 ; Absolute positioning'
    ];
    for (var index = 0; index < gCode.length; index++) {
        var element = gCode[index];
        data.push(element.code());
    }
    return data;
}

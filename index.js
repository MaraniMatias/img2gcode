"use strict";
var line_1 = require("./line");
var fs = require("fs");
var lwip = require('lwip');
var img = './img/5x5.png';
var maxZ = 765;
function intensity(pixel) {
    var a = (pixel.a > 1) ? pixel.a / 100 : 1;
    return (pixel.r + pixel.g + pixel.b) * a;
}
function pixelToG(gCode, p1, p2) {
    var i1 = intensity(p1.colour), i2 = intensity(p2.colour), maxZ = 765;
    if (i1 > i2) {
        var axes = { x: p2.axes.x, y: p2.axes.y };
        gCode.push(new line_1.default(axes, p2.colour));
        gCode.push(new line_1.default({ z: i2 }, p2.colour));
    }
    if (i1 < i2) {
        gCode.push(new line_1.default({ z: i2 }, p2.colour));
    }
    if (i1 == 0 && i1 == i2) {
        var axes = { x: p2.axes.x, y: p2.axes.y };
        gCode.push(new line_1.default(axes, p2.colour));
    }
}
function pixelAnalysis(image) {
    return new Promise(function (resolve, reject) {
        var gCode = [], height = image.height(), width = image.width(), pixelOld = { colour: image.getPixel(0, 0), axes: { x: 0, y: 0 } };
        for (var y = 0; y < height; ++y) {
            for (var x = 0; x < width; ++x) {
                if (!(x == 0 && y == 0)) {
                    var p = image.getPixel(x, y);
                    var pixelNew = { colour: { r: p.r, g: p.g, b: p.b, a: p.a }, axes: { x: x, y: y } };
                    pixelToG(gCode, pixelOld, pixelNew);
                    pixelOld = pixelNew;
                }
            }
        }
        resolve(gCode);
    });
}
;
function main(img) {
    fs.unlink("./img/myCodeG.gcode");
    lwip.open(img, function (err, image) {
        pixelAnalysis(image).then(function (gCode) {
            toFile(gCode);
            console.log(__dirname + "/img/myCodeG.gcode");
        });
    });
}
main(img);
function toFile(gCode) {
    var data = concat(gCode);
    for (var index = 0; index < data.length; index++) {
        var lineG = data[index];
        console.log(lineG);
        fs.appendFile("./img/myCodeG.gcode", lineG + '\r\n', { encoding: "utf8" }, function (err) {
            if (err)
                throw err;
        });
    }
}
function concat(gCode) {
    var data = [
        'G21 ; Set units to mm',
        'G90 ; Absolute positioning',
        ("G01 X0 Y0 Z" + maxZ + " ; Initial line")
    ];
    for (var index = 0; index < gCode.length; index++) {
        var element = gCode[index];
        data.push(element.code());
    }
    return data;
}

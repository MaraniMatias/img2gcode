"use strict";
var ImgToGCode = (function () {
    function ImgToGCode(dirImg) {
        this._dirGCode = '.gcode';
        this._dirImg = dirImg;
        this._dirGCode = dirImg.substring(0, dirImg.lastIndexOf(".")) + '.gcode';
        console.log(this._dirGCode);
    }
    ImgToGCode.prototype.intensity = function (pixel) {
        return (pixel.r + pixel.g + pixel.b) * ((pixel.a > 1) ? pixel.a / 100 : 1);
    };
    ImgToGCode.prototype.main = function () {
    };
    return ImgToGCode;
}());
var img2gcode = new ImgToGCode("./img/25x25.png");
img2gcode.main();

"use strict";
var fs = require("fs");
var File = (function () {
    function File(gCodeInit) {
        if (gCodeInit) {
            this._gCodeInit = gCodeInit;
        }
        else {
            this._gCodeInit = [
                'G21 ; Set units to mm',
                'G90 ; Absolute positioning',
                'G01 X0 Y0 Z765; con Z max',
            ];
        }
    }
    File.prototype.concat = function (gCode) {
        for (var index = 0; index < gCode.length; index++) {
            var element = gCode[index];
            if (element.show) {
                this._gCodeInit.push(element.code());
            }
        }
        return this._gCodeInit;
    };
    File.prototype.save = function (dirGCode, gCode, cb) {
        fs.unlink(dirGCode);
        fs.writeFile(dirGCode, this.concat(gCode).join('\n'), { encoding: "utf8" }, function (err) {
            if (err)
                throw err.message;
            if (cb)
                cb();
        });
    };
    return File;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = File;

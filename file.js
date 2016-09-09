"use strict";
const fs = require("fs");
class File {
    constructor(gCodeInit) {
        if (gCodeInit) {
            this._gCodeInit = gCodeInit;
        }
        else {
            this._gCodeInit = [
                ";---> this code is for cnc-ino <---",
                'G21 ; Set units to mm',
                'G90 ; Absolute positioning'
            ];
        }
    }
    concat(gcode, config) {
        for (let count = 0, step = 0; count <= config.totalStep; count++, step = step + config.deepStep) {
            for (let index = 0; index < gcode.length; index++) {
                let e = gcode[index];
                this._gCodeInit.push(e.code(step));
            }
            let e = gcode[gcode.length - 1];
            this._gCodeInit.push(`G01 X${e.axes.x} Y${e.axes.y} Z${config.sevaZ}; With new deep step`);
        }
        this._gCodeInit.push(`G01 Z${config.sevaZ}; With Z max`);
        return this._gCodeInit;
    }
    save(gcode, config, cb) {
        this._gCodeInit.push(`; ${config.dir.img}`, `; ${config.dir.gCode}`, `; Img Size: ${config.imgSize}`, `; Tool Diameter: ${config.toolDiameter}`, `; Scale Axes: ${config.scaleAxes}`, `; Deep Step: ${config.deepStep}`, `; Z Save: ${config.sevaZ}`, `; Z White: ${config.whiteZ}`, `; Z Black: ${config.blackZ}`);
        fs.unlink(config.dir.gCode, (err) => {
            fs.writeFile(config.dir.gCode, this.concat(gcode, config).join('\n'), { encoding: "utf8" }, (err) => {
                if (err)
                    throw err.message;
                if (cb)
                    cb(config.dir.gCode);
            });
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = File;
//# sourceMappingURL=file.js.map
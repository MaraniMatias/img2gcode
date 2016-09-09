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
    concat(config) {
        for (let count = 0, step = 0; count <= config.totalStep; count++, step = step + config.deepStep) {
            for (let index = 0; index < config.gcode.length; index++) {
                let element = config.gcode[index];
                this._gCodeInit.push(element.code(step));
            }
            let e = config.gcode[config.gcode.length - 1];
            this._gCodeInit.push(`G01 X${e._axes.x} Y${e._axes.y} Z${config.sevaZ}; With new deep step`);
        }
        this._gCodeInit.push(`G01 Z${config.sevaZ}; With Z max`);
        return this._gCodeInit;
    }
    save(config, cb) {
        fs.unlink(config.dir, (err) => {
            fs.writeFile(config.dir, this.concat(config).join('\n'), { encoding: "utf8" }, (err) => {
                if (err)
                    throw err.message;
                if (cb)
                    cb(config.dir);
            });
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = File;
//# sourceMappingURL=file.js.map
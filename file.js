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
    concat(gCode) {
        for (let index = 0; index < gCode.length; index++) {
            let element = gCode[index];
            this._gCodeInit.push(element.code());
        }
        return this._gCodeInit;
    }
    save(dirGCode, gCode, cb) {
        fs.unlink(dirGCode, (err) => {
            fs.writeFile(dirGCode, this.concat(gCode).join('\n'), { encoding: "utf8" }, (err) => {
                if (err)
                    throw err.message;
                if (cb)
                    cb();
            });
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = File;
//# sourceMappingURL=file.js.map
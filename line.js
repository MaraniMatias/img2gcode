"use strict";
class Line {
    constructor(axes, comment) {
        this._axes = axes;
        if (comment) {
            this._comment = comment;
        }
    }
    get comment() {
        return this._comment;
    }
    set comment(v) {
        this._comment = v;
    }
    get axes() {
        return this._axes;
    }
    code() {
        let x = this._axes.x !== undefined ? ` X${this._axes.x}` : '';
        let y = this._axes.y !== undefined ? ` Y${this._axes.y}` : '';
        let z = this._axes.z !== undefined ? ` Z${this._axes.z}` : '';
        let comment = this._comment ? `; ${this._comment}` : '';
        return "G01" + x + y + z + comment;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Line;
//# sourceMappingURL=line.js.map
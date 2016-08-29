"use strict";
class Line {
    constructor(show, pixel, comment) {
        this._show = show;
        this._pixel = pixel;
        if (comment) {
            this._comment = comment;
        }
    }
    get show() {
        return this._show;
    }
    set show(v) {
        this._show = v;
    }
    get comment() {
        return this._comment;
    }
    set comment(v) {
        this._comment = v;
    }
    get axes() {
        return this._pixel.axes;
    }
    get intensity() {
        return this._pixel.intensity;
    }
    code() {
        let show = this._show ? '' : ';';
        let x = this._pixel.axes.x !== undefined ? ` X${this._pixel.axes.x}` : '';
        let y = this._pixel.axes.y !== undefined ? ` Y${this._pixel.axes.y}` : '';
        let z = this._pixel.axes.z !== undefined ? ` Z${this._pixel.axes.z}` : '';
        let comment = this._comment ? `; ${this._comment}` : '';
        return show + "G01" + x + y + z + comment;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Line;

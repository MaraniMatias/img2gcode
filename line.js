"use strict";
var Line = (function () {
    function Line(show, pixel, comment) {
        this._show = show;
        this._pixel = pixel;
        if (comment) {
            this._comment = comment;
        }
    }
    Object.defineProperty(Line.prototype, "show", {
        get: function () {
            return this._show;
        },
        set: function (v) {
            this._show = v;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "comment", {
        get: function () {
            return this._comment;
        },
        set: function (v) {
            this._comment = v;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "axes", {
        get: function () {
            return this._pixel.axes;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "intensity", {
        get: function () {
            return this._pixel.intensity;
        },
        enumerable: true,
        configurable: true
    });
    Line.prototype.code = function () {
        var show = this._show ? '' : ';';
        var x = this._pixel.axes.x !== undefined ? " X" + this._pixel.axes.x : '';
        var y = this._pixel.axes.y !== undefined ? " Y" + this._pixel.axes.y : '';
        var z = this._pixel.axes.z !== undefined ? " Z" + this._pixel.axes.z : '';
        var comment = this._comment ? "; " + this._comment : '';
        return show + "G01" + x + y + z + comment;
    };
    return Line;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Line;

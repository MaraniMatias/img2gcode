"use strict";
var Line = (function () {
    function Line(show, axes, colour, comment) {
        this._axes = axes;
        this._show = show;
        if (this._colour) {
            this._colour = colour;
        }
        if (this._colour) {
            this._comment = comment;
        }
    }
    Object.defineProperty(Line.prototype, "axes", {
        get: function () {
            return this._axes;
        },
        set: function (v) {
            this._axes = v;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Line.prototype, "colour", {
        get: function () {
            return this._colour;
        },
        set: function (v) {
            this._colour = v;
        },
        enumerable: true,
        configurable: true
    });
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
    Line.prototype.code = function () {
        var s = this._show ? '' : ';';
        var x = this._axes.x !== undefined ? " X" + this._axes.x : '';
        var y = this._axes.y !== undefined ? " Y" + this._axes.y : '';
        var z = this._axes.z !== undefined ? " Z" + this._axes.z : '';
        var comment = this._comment ? "; " + this._comment : '';
        return s + "G01" + x + y + z + comment;
    };
    return Line;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Line;

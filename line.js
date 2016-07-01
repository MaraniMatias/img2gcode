"use strict";
var line = (function () {
    function line(axes, colour, comment) {
        this._axes = axes;
        if (this._colour) {
            this._colour = colour;
        }
        if (this._colour) {
            this._comment = comment;
        }
    }
    Object.defineProperty(line.prototype, "axes", {
        get: function () {
            return this._axes;
        },
        set: function (v) {
            this._axes = v;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(line.prototype, "colour", {
        get: function () {
            return this._colour;
        },
        set: function (v) {
            this._colour = v;
        },
        enumerable: true,
        configurable: true
    });
    line.prototype.code = function () {
        var x = this._axes.x !== undefined ? " X" + this._axes.x : '';
        var y = this._axes.y !== undefined ? " Y" + this._axes.y : '';
        var z = this._axes.z !== undefined ? " Z" + this._axes.z : '';
        var comment = this._comment ? "; " + this._comment : '';
        return "G01" + x + y + z + comment;
    };
    Object.defineProperty(line.prototype, "comment", {
        get: function () {
            return this._comment;
        },
        set: function (v) {
            this._comment = v;
        },
        enumerable: true,
        configurable: true
    });
    return line;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = line;

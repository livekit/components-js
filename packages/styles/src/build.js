"use strict";
exports.__esModule = true;
var convert = require("js-to-css-generator");
var styles = require("./styles");
var file = {
    name: 'styles.css',
    module: styles
};
var cssFile = convert.jsToCss(file);
// @ts-ignore
console.log(cssFile.css);

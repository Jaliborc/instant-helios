# Instant Helios
[![](https://img.shields.io/npm/v/instant-helios.svg)](https://www.npmjs.com/package/instant-helios) [![](https://travis-ci.org/Jaliborc/instant-helios.svg)](https://travis-ci.org/Jaliborc/instant-helios/) ![](https://david-dm.org/jaliborc/instant-helios.svg) ![](https://img.shields.io/npm/l/instant-helios.svg)

This package is able to automatically generate a static website, using  HTML5Up's [Helios](https://html5up.net/helios) design and an extended [JsonResume](https://jsonresume.org/) schema.

[Preview](http://jaliborc.com/)

## Command Line Usage
Install using npm:

    npm install -g instant-helios

Use the `helios` command to generate the website:

    helios myDataFile.json

The results will be stored in a `/build` folder on the directory of the provided data file.  
You can use flags to only generate a type of file, instead of the whole website. For example, this will only generate the javascript files:

    helios myDataFile.json --js

Full tag list:

    --all               Generate everything (default behaviour)
    --html or --pug     Generate .html files and resized media files
    --css or --sass     Generate .css files
    --js                Generate .js files
    --assets            Copy media assets (placeholder images, icons,...)

## Programmatic Usage
You can use *Instant Helios* in node as well:

    let helios = require('instant-helios')
    let buildDirectory = <a directory of your choosing>
    let data = <data structure as if parsed from a .json file>

    // Generate .html files and resized media files
    helios.html(buildDirectory, data)

    // Generate .css files
    helios.css(buildDirectory, data)

    // Generate .js files
    helios.js(buildDirectory)

    // Copy media assets
    helios.assets(buildDirectory)

#!/usr/bin/env bash

grunt

terser dist/nano.js -o dist/nano.min.js
cp dist/nano.js examples/js/nano.js
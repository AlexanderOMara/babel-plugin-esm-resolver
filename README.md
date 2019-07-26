# babel-plugin-esm-resolver

A Babel plugin for resolving ESM import and export paths

[![npm](https://img.shields.io/npm/v/babel-plugin-esm-resolver.svg)](https://npmjs.com/package/babel-plugin-esm-resolver)
[![node](https://img.shields.io/node/v/babel-plugin-esm-resolver.svg)](https://nodejs.org)

[![dependencies](https://david-dm.org/AlexanderOMara/babel-plugin-esm-resolver.svg)](https://david-dm.org/AlexanderOMara/babel-plugin-esm-resolver)
[![size](https://packagephobia.now.sh/badge?p=babel-plugin-esm-resolver)](https://packagephobia.now.sh/result?p=babel-plugin-esm-resolver)
[![downloads](https://img.shields.io/npm/dm/babel-plugin-esm-resolver.svg)](https://npmcharts.com/compare/babel-plugin-esm-resolver?minimal=true)

[![travis-ci](https://travis-ci.org/AlexanderOMara/babel-plugin-esm-resolver.svg?branch=master)](https://travis-ci.org/AlexanderOMara/babel-plugin-esm-resolver)


# Overview

Resolves ESM import and export paths to other source modules with extensions, optionally replacing the extension with a different one. This is useful because browsers cannot perform automatic file extension resolution, and other environments like Node may not have this enabled by default either.

Must be configured to work properly, and will throw an error if any modules cannot be resolved (this can optionally be turned off).

Since it resolves the statements before the modules are transpiled, it can also be used to resolve the paths for other transpiled module loaders.


# Usage

## Options

-   [source](options/source.md)
-   [submodule](options/submodule.md)
-   [module](options/module.md)


# Bugs

If you find a bug or have compatibility issues, please open a ticket under issues section for this repository.


# License

Copyright (c) 2019 Alexander O'Mara

Licensed under the Mozilla Public License, v. 2.0.

If this license does not work for you, feel free to contact me.

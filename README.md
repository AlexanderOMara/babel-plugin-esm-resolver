# babel-plugin-esm-resolver

A Babel plugin for resolving ESM import and export paths

[![npm](https://img.shields.io/npm/v/babel-plugin-esm-resolver.svg)](https://npmjs.com/package/babel-plugin-esm-resolver)
[![node](https://img.shields.io/node/v/babel-plugin-esm-resolver.svg)](https://nodejs.org)

[![dependencies](https://img.shields.io/david/AlexanderOMara/babel-plugin-esm-resolver.svg)](https://david-dm.org/AlexanderOMara/babel-plugin-esm-resolver)
[![size](https://packagephobia.now.sh/badge?p=babel-plugin-esm-resolver)](https://packagephobia.now.sh/result?p=babel-plugin-esm-resolver)
[![downloads](https://img.shields.io/npm/dm/babel-plugin-esm-resolver.svg)](https://npmcharts.com/compare/babel-plugin-esm-resolver?minimal=true)

[![Build Status](https://github.com/AlexanderOMara/babel-plugin-esm-resolver/workflows/main/badge.svg?branch=master)](https://github.com/AlexanderOMara/babel-plugin-esm-resolver/actions?query=workflow%3Amain+branch%3Amaster)


# Overview

Resolves ESM import and export paths to other source modules with extensions, optionally replacing the extension with a different one. This is useful because browsers cannot perform automatic file extension resolution, and other environments like Node may not have this enabled by default either.

Since it resolves the statements before the modules are transpiled, it can also be used to resolve the paths for other transpiled module loaders.

Must be configured to work properly, it will not do anything by default.

There are three classes of resolver that can be enabled (`source`, `module`, `submodule`) depending on the modules that need to be resloved.


# Usage

## Options

-   [`source`](options/source.md) Source modules (`import foo from './bar'`).
-   [`module`](options/module.md) Module main entry points (`import foo from 'bar'`).
-   [`submodule`](options/submodule.md) Module submodules (`import foo from 'bar/foo'`).


# Bugs

If you find a bug or have compatibility issues, please open a ticket under issues section for this repository.


# License

Copyright (c) 2019-2020 Alexander O'Mara

Licensed under the Mozilla Public License, v. 2.0.

If this license does not work for you, feel free to contact me.

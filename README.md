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

### `extensions`

A list of extensions to resolve, and optionally the extension that should be used once transpiled.

Takes the form of one of the following.

1.  Resolve `.js` or `.json` in that order.

```json
[
	".js",
	".json"
]
```

2.  Resolve `.ts` or `.json` in that order, uses `.js` for imports of `.ts` modules in transpiled code.

```json
[
	[".ts", ".js"],
	".json"
]
```

3.  Resolve `.ts`, `.tsx`, or `.json` in that order, uses `.js` for imports of `.ts` and `.tsx` modules in transpiled code.

```json
[
	[[".ts", ".tsx"], ".js"],
	".json"
]
```

### `extensionsSubmodule`

A list of extensions to resolve when importing a module's submodules (`import a from 'aaa/submod';`, `import b from '@org/bbb/submod';`).

```json
[
	".js",
	".json"
]
```

### `ignoreUnresolved`

Set to `true` to ignore any modules that cannot be resolved.

By default an error is throw for any modules that cannot be resolved.


## Examples

### `.js` -> `.js`

`.babelrc`

```json
{
	"presets": [
		["@babel/preset-env", {
			"modules": false,
			"targets": {
				"node": "current"
			}
		}]
	],
	"plugins": [
		["esm-resolver", {
			"extensions": [
				".js"
			]
		}]
	]
}
```

`src/main.js`

```js
import {foo} from './bar';
```

`src/bar.js`

```js
export const foo = 123;
```

**output:**

```js
import { foo } from "./bar.js";
```


### `.ts` -> `.js`

(In practice the TypeScript preset would probably also be used)

`.babelrc`

```json
{
	"presets": [
		["@babel/preset-env", {
			"modules": false,
			"targets": {
				"node": "current"
			}
		}]
	],
	"plugins": [
		["esm-resolver", {
			"extensions": [
				[".ts", ".js"]
			]
		}]
	]
}
```

**output:**

```js
import { foo } from "./bar.js";
```


### `.ts` + `.js` -> `.ts`

`.babelrc`

```json
{
	"presets": [
		["@babel/preset-env", {
			"modules": false,
			"targets": {
				"node": "current"
			}
		}]
	],
	"plugins": [
		["esm-resolver", {
			"extensions": [
				[[".ts", ".js"], ".js"]
			]
		}]
	]
}
```

`src/main.ts`

```js
import {foo} from './bar';
import {bar} from './foo';
```

`src/bar.ts`

```js
export const foo = 123;
```

`src/foo.js`

```js
export const bar = 123;
```

**output:**

```js
import { foo } from "./bar.js";
import { bar } from "./foo.js";
```


# Bugs

If you find a bug or have compatibility issues, please open a ticket under issues section for this repository.


# License

Copyright (c) 2019 Alexander O'Mara

Licensed under the Mozilla Public License, v. 2.0.

If this license does not work for you, feel free to contact me.

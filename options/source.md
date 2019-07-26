# `source`

Options for resolving other source modules in the source files (`import foo from './bar'`).

Must be set to an object to be enabled. That object may contain the following options.

## `source.extensions`

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

## `source.ignoreUnresolved`

Set to `true` to ignore any source modules that cannot be resolved.


# Examples

## Example `.js` -> `.js`

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
			"source": {
				"extensions": [
					".js"
				]
			}
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


## Example `.ts` -> `.js`

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
			"source": {
				"extensions": [
					[".ts", ".js"]
				]
			}
		}]
	]
}
```

**output:**

```js
import { foo } from "./bar.js";
```


## Example `.ts` + `.js` -> `.js`

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
			"source": {
				"extensions": [
					[[".ts", ".js"], ".js"]
				]
			}
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

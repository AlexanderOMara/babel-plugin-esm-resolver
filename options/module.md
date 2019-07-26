# `module`

Options for resolving module entry points in installed modules (`import foo from 'bar'`).

Must be set to an object to be enabled. That object may contain the following options.

## `module.entry`

A list of entry point resolvers.

```json
[
	{
		"type": "package.json",
		"field": "module",
		"extensions": [
			".mjs",
			".js"
		]
	},
	{
		"type": "file",
		"path": "./module",
		"extensions": [
			".mjs",
			".js"
		]
	}
]
```


# Examples

## Example `package.json` field `module`

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
			"module": {
				"entry": [
					{
						"type": "package.json",
						"field": "module",
						"extensions": [
							".mjs",
							".js"
						]
					}
				]
			}
		}]
	]
}
```

`src/main.js`

```js
import {foo} from 'bar';
```

**output:**

```js
import { foo } from "bar/lib/index.mjs";


## Example `file` path `./module`

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
			"module": {
				"entry": [
					{
						"type": "file",
						"path": "./module",
						"extensions": [
							".mjs",
							".js"
						]
					}
				]
			}
		}]
	]
}
```

`src/main.js`

```js
import {foo} from 'bar';
```

**output:**

```js
import { foo } from "bar/module.mjs";

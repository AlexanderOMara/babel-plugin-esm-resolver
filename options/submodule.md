# `submodule`

Options for resolving submodules in installed modules (`import foo from 'bar/foo'`).

Must be set to an object to be enabled. That object may contain the following options.

## `submodule.extensions`

A list of extensions to resolve when importing a module's submodules.

```json
[
	".js",
	".json"
]
```

## `submodule.ignoreUnresolved`

Set to `true` to ignore any submodule modules that cannot be resolved.


# Examples

## Example `.mjs` + `.js`

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
			"submodule": {
				"extensions": [
					".mjs",
					".js"
				]
			}
		}]
	]
}
```

`src/main.js`

```js
import {foo} from 'bar/foo';
```

**output:**

```js
import { foo } from "bar/foo.mjs";
```

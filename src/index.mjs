import fs from 'fs';
import path from 'path';
import Module from 'module';
import process from 'process';

let moduleIsBuiltinCache = null;

/**
 * Check if a module name is a built-in module.
 *
 * @param {string} name Module name.
 * @returns {boolean} Is built-in.
 */
function moduleIsBuiltin(name) {
	if (/^node:/.test(name)) {
		return true;
	}
	while (!moduleIsBuiltinCache) {
		// Node v9.3.0+
		const list = Module.builtinModules;
		if (list) {
			moduleIsBuiltinCache = new Set(list);
			break;
		}

		// Older versions:
		const natives = process.binding('natives');
		if (natives) {
			const list = Object.keys(natives).filter(
				s => !/^internal\//.test(s)
			);
			moduleIsBuiltinCache = new Set(list);
			break;
		}

		throw new Error('Cannot lookup builtin modules');
	}
	return moduleIsBuiltinCache.has(name);
}

/**
 * Stat path if exists.
 *
 * @param {string} path File path.
 * @returns {fs.Stats|null} Stat object or null.
 */
function pathStat(path) {
	try {
		// eslint-disable-next-line no-sync
		return fs.statSync(path);
		// eslint-disable-next-line no-unused-vars
	} catch (err) {
		return null;
	}
}

/**
 * Read JSON from path.
 *
 * @param {string} path JSON path.
 * @returns {object|Array|string|number|boolean|null} JSON data.
 */
function readJson(path) {
	// eslint-disable-next-line no-sync
	return JSON.parse(fs.readFileSync(path, 'utf8'));
}

/**
 * Read module package.json file.
 *
 * @param {string} moduleDir Module directory.
 * @returns {object} Contents of package.json file.
 */
function readPackageJson(moduleDir) {
	return readJson(path.join(moduleDir, 'package.json'));
}

/**
 * Trim ./ from head of string.
 *
 * @param {string} path Path string.
 * @returns {string} Trimmed string.
 */
function trimDotSlash(path) {
	return path.replace(/^(\.\/)+/, '');
}

/**
 * Check if import path is a built-in module.
 *
 * @param {string} path Import path.
 * @returns {boolean} Is built-in.
 */
function importIsBuiltin(path) {
	return moduleIsBuiltin(path);
}

/**
 * Check if import path is a URL.
 *
 * @param {string} path Import path.
 * @returns {boolean} Is URL.
 */
function importIsUrl(path) {
	return /^[^/]+:\/\//.test(path);
}

/**
 * Check if import path is a file.
 *
 * @param {string} path Import path.
 * @returns {boolean} Is file.
 */
function importIsFile(path) {
	return path === '.' || path === '..' || /^\.?\.?\//.test(path);
}

/**
 * Parse bare imort path, namespace aware.
 *
 * @param {string} path Import path.
 * @returns {string} Object with package name and path.
 */
function importBareParse(path) {
	const ns = path.match(/^(@[^/]+\/[^/]+)([\s\S]*)$/);
	if (ns) {
		return {
			name: ns[1],
			path: ns[2]
		};
	}
	const pk = path.match(/^([^/]+)([\s\S]*)$/);
	if (pk) {
		return {
			name: pk[1],
			path: pk[2]
		};
	}
	return null;
}

/**
 * Expand extensions options into a list.
 *
 * @param {string|Array} e Extenions to be expanded.
 * @returns {object} List of sources and a destination.
 */
function expandExtensions(e) {
	let src = null;
	let dst = null;
	if (Array.isArray(e)) {
		const l = e.length;
		src = l ? e[0] : null;
		dst = l > 1 ? e[1] : null;
	} else {
		src = e;
	}
	const srcs = Array.isArray(src) ? src : [src];
	return {
		srcs,
		dst
	};
}

/**
 * Get module paths for a file.
 *
 * @param {string} file File path.
 * @returns {Array} Module paths.
 */
function modulePathsForFile(file) {
	// Node v12.2.0+:
	if (Module.createRequire) {
		return Module.createRequire(file).resolve.paths('');
	}

	// Node v10.12.0+:
	if (Module.createRequireFromPath) {
		return Module.createRequireFromPath(file).resolve.paths('');
	}

	// Older versions:
	return [].concat(
		Module._nodeModulePaths(path.dirname(file)),
		Module.globalPaths
	);
}

/**
 * Resolve the named module director for a file.
 *
 * @param {string} name Module name.
 * @param {string} file File path.
 * @returns {string} Director path.
 */
function resolveModuleDir(name, file) {
	const paths = modulePathsForFile(file);
	for (const p of paths) {
		const full = path.join(p, name);
		if (pathStat(full)) {
			return full;
		}
	}
	throw new Error(
		`Failed to resolve directory for module: ${name} in: ${file}`
	);
}

/**
 * Resolve extension for a path base.
 *
 * @param {string} value Path value.
 * @param {string} base Path base.
 * @param {Array|string} extensions Extensions option.
 * @param {boolean} expand Should extensions be expanded.
 * @returns {string|null} Resolved path or null.
 */
function resolveExtension(value, base, extensions, expand = false) {
	let paths;
	while (!paths) {
		// If explicit directory, search for dir+index+ext.
		if (/[\\/]$/.test(base)) {
			paths = ['index'];
			break;
		}

		// If not directory/file, search for file+ext.
		const stat = pathStat(base);
		if (!stat) {
			paths = [''];
			break;
		}

		// If a directory, search for file+ext then dir+index+ext.
		if (stat.isDirectory()) {
			paths = ['', '/index'];
			break;
		}

		// Already full path, no need to search, maybe replace ext.
		if (expand) {
			const valueL = value.length;
			for (const extension of extensions) {
				const {srcs, dst} = expandExtensions(extension);
				for (const src of srcs) {
					const extI = valueL - src.length;
					if (extI < 0 || value.substring(extI) !== src) {
						continue;
					}
					if (dst === null) {
						return value;
					}
					return `${value.substring(0, extI)}${dst}`;
				}
			}
		}

		// Nothing to replace, use as is.
		return value;
	}

	// Search for the file with the extension at the paths.
	for (const path of paths) {
		for (const extension of extensions) {
			const {srcs, dst} = expand
				? expandExtensions(extension)
				: {srcs: [extension], dst: extension};
			for (const src of srcs) {
				const stat = pathStat(`${base}${path}${src}`);
				if (stat && !stat.isDirectory()) {
					const e = dst === null ? `${path}${src}` : `${path}${dst}`;
					return `${value}${e}`;
				}
			}
		}
	}
	return null;
}

/**
 * Visitor callback for declaration with path.
 *
 * @param {string} src Source path.
 * @param {object} state AST state.
 * @returns {string} Resolved path.
 */
function resolveDeclarationPath(src, state) {
	// Parse options.
	const optsSource = (state.opts || {}).source;
	if (!optsSource) {
		return src;
	}
	const extensions = optsSource.extensions || [];
	const ignoreUnresolved = optsSource.ignoreUnresolved || false;

	// Resolve the file base.
	const {filename} = state.file.opts;
	const resolveBase = path.join(path.dirname(filename), src);

	// Resolve from the base.
	const resolved = resolveExtension(src, resolveBase, extensions, true);
	if (resolved === null) {
		if (!ignoreUnresolved) {
			throw new Error(`Failed to resolve path: ${src} in: ${filename}`);
		}
		return src;
	}
	return resolved;
}

/**
 * Visitor callback for declaration with bare import path.
 *
 * @param {string} src Source path.
 * @param {object} state AST state.
 * @param {object} bareImport Bare import info object.
 * @returns {string} Resolved path.
 */
function resolveDeclarationBarePath(src, state, bareImport) {
	// Parse options.
	const optsSubmodule = (state.opts || {}).submodule;
	if (!optsSubmodule) {
		return src;
	}
	const extensions = optsSubmodule.extensions || [];
	const ignoreUnresolved = optsSubmodule.ignoreUnresolved || false;
	const ignoreExports = optsSubmodule.ignoreExports || false;

	// Resolve the module base, or fail.
	const {filename} = state.file.opts;
	const moduleName = bareImport.name;
	const moduleDir = resolveModuleDir(moduleName, filename);

	// Optionally ignore modules that have exports.
	if (ignoreExports && 'exports' in readPackageJson(moduleDir)) {
		return src;
	}

	// Resolve the file then resolve extension.
	const resolveBase = `${moduleDir}${bareImport.path}`;
	const resolved = resolveExtension(src, resolveBase, extensions);
	if (resolved === null) {
		if (!ignoreUnresolved) {
			throw new Error(`Failed to resolve module: ${src} in: ${filename}`);
		}
		return src;
	}
	return resolved;
}

/**
 * Visitor callback for declaration with bare import main.
 *
 * @param {string} src Source path.
 * @param {object} state AST state.
 * @param {object} bareImport Bare import info object.
 * @returns {string} Resolved path.
 */
function resolveDeclarationBareMain(src, state, bareImport) {
	// Parse options.
	const optsModule = (state.opts || {}).module;
	if (!optsModule) {
		return src;
	}
	const entry = optsModule.entry || [];
	const ignoreExports = optsModule.ignoreExports || false;
	if (!entry.length) {
		return src;
	}

	// Resolve the module base, or fail.
	const {filename} = state.file.opts;
	const moduleName = bareImport.name;
	const moduleDir = resolveModuleDir(moduleName, filename);

	// Optionally ignore modules that have exports.
	let pkg = null;
	if (ignoreExports && 'exports' in (pkg = readPackageJson(moduleDir))) {
		return src;
	}

	// Try different entry resolvers.
	for (const info of entry) {
		const entryType = info.type;
		let filePath = null;
		let extensions = [];

		// Handle the different types.
		switch (entryType) {
			case 'package.json': {
				pkg = pkg || readPackageJson(moduleDir);
				filePath = pkg ? pkg[info.field] : null;
				extensions = info.extensions || [];
				break;
			}
			case 'file': {
				filePath = info.path;
				extensions = info.extensions || [];
				break;
			}
			default: {
				throw new Error(`Unknown entry type: ${entryType}`);
			}
		}

		// Skip if empty path.
		if (!filePath) {
			continue;
		}

		// Resolve entry if possible.
		const resolveBase = path.join(moduleDir, filePath);
		const value = `${src}/${trimDotSlash(filePath)}`;
		const resolved = resolveExtension(value, resolveBase, extensions);
		if (resolved !== null) {
			return resolved;
		}
	}
	return src;
}

/**
 * Visitor callback for declarations.
 *
 * @param {object} nodePath AST node.
 * @param {object} state AST state.
 */
function visitDeclaration(nodePath, state) {
	const {source} = nodePath.node;
	if (!source) {
		return;
	}

	// Get source, check if needs resolving, and how.
	const src = source.value;

	// Ignore any URL imports.
	if (importIsUrl(src)) {
		return;
	}

	// Ignore any builin modules.
	if (importIsBuiltin(src)) {
		return;
	}

	// Check if file path.
	if (importIsFile(src)) {
		source.value = resolveDeclarationPath(src, state);
		return;
	}

	// Check if bare import (a module or submodule).
	const bareImport = importBareParse(src);
	if (bareImport) {
		source.value = bareImport.path
			? resolveDeclarationBarePath(src, state, bareImport)
			: resolveDeclarationBareMain(src, state, bareImport);
		return;
	}
}

/**
 * Babel plugin entry point.
 *
 * @returns {object} Plugin methods.
 */
export default () => ({
	visitor: {
		/**
		 * Visitor callback for import declarations.
		 *
		 * @param {object} path AST node.
		 * @param {object} state AST state.
		 */
		ImportDeclaration(path, state) {
			visitDeclaration(path, state);
		},

		/**
		 * Visitor callback for export all declarations.
		 *
		 * @param {object} path AST node.
		 * @param {object} state AST state.
		 */
		ExportAllDeclaration(path, state) {
			visitDeclaration(path, state);
		},

		/**
		 * Visitor callback for export names declarations.
		 *
		 * @param {object} path AST node.
		 * @param {object} state AST state.
		 */
		ExportNamedDeclaration(path, state) {
			visitDeclaration(path, state);
		}
	}
});

import fs from 'fs';
import path from 'path';
import Module from 'module';
import process from 'process';

let moduleIsBuiltinCache = null;

function moduleIsBuiltin(name) {
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
			const list = Object.keys(natives)
				.filter(s => !/^internal\//.test(s));
			moduleIsBuiltinCache = new Set(list);
			break;
		}

		throw new Error('Cannot lookup builtin modules');
	}
	return moduleIsBuiltinCache.has(name);
}

function pathStat(path) {
	try {
		// eslint-disable-next-line no-sync
		return fs.statSync(path);
	}
	catch (err) {
		return null;
	}
}

function readJson(path) {
	// eslint-disable-next-line no-sync
	return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function trimDotSlash(path) {
	return path.replace(/^(\.\/)+/, '');
}

function importIsBuiltin(path) {
	return moduleIsBuiltin(path);
}

function importIsUrl(path) {
	return /^[^/]+:\/\//.test(path);
}

function importIsFile(path) {
	return path === '.' || path === '..' || /^\.?\.?\//.test(path);
}

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

function expandExtensions(e) {
	let src = null;
	let dst = null;
	if (Array.isArray(e)) {
		const l = e.length;
		src = l ? e[0] : null;
		dst = l > 1 ? e[1] : null;
	}
	else {
		src = e;
	}
	const srcs = Array.isArray(src) ? src : [src];
	return {
		srcs,
		dst
	};
}

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

function resolveExtension(base, extensions, expand = false) {
	const stat = pathStat(base);
	const paths = [''];
	if (stat) {
		if (stat.isDirectory()) {
			paths.push('/index');
		}
		else {
			return '';
		}
	}
	for (const path of paths) {
		for (const extension of extensions) {
			const {srcs, dst} = expand ? expandExtensions(extension) : {
				srcs: [extension],
				dst: extension
			};
			for (const src of srcs) {
				const stat = pathStat(`${base}${path}${src}`);
				if (stat && !stat.isDirectory()) {
					return dst === null ? `${path}${src}` : `${path}${dst}`;
				}
			}
		}
	}
	return null;
}

function visitDeclarationPath(nodePath, state) {
	const {source} = nodePath.node;
	const src = source.value;

	// Parse options.
	const optsSource = (state.opts || {}).source;
	if (!optsSource) {
		return;
	}
	const extensions = optsSource.extensions || [];
	const ignoreUnresolved = optsSource.ignoreUnresolved || false;

	// Resolve the file base.
	const {filename} = state.file.opts;
	const resolveBase = path.join(path.dirname(filename), src);

	// Resolve from the base.
	const resolved = resolveExtension(resolveBase, extensions, true);
	if (resolved === null) {
		if (!ignoreUnresolved) {
			throw new Error(
				`Failed to resolve path: ${src} in: ${filename}`
			);
		}
	}
	else {
		source.value += resolved;
	}
}

function visitDeclarationBarePath(nodePath, state, bareImport) {
	const {source} = nodePath.node;
	const src = source.value;

	// Parse options.
	const optsSubmodule = (state.opts || {}).submodule;
	if (!optsSubmodule) {
		return;
	}
	const extensions = optsSubmodule.extensions || [];
	const ignoreUnresolved = optsSubmodule.ignoreUnresolved || false;

	// Resolve the module base, or fail.
	const {filename} = state.file.opts;
	const moduleName = bareImport.name;
	const moduleDir = resolveModuleDir(moduleName, filename);

	// Resolve the file then resolve extension.
	const resolveBase = `${moduleDir}${bareImport.path}`;
	const resolved = resolveExtension(resolveBase, extensions);
	if (resolved === null) {
		if (!ignoreUnresolved) {
			throw new Error(
				`Failed to resolve module: ${src} in: ${filename}`
			);
		}
	}
	else {
		const {source} = nodePath.node;
		source.value += resolved;
	}
}

function visitDeclarationBareMain(nodePath, state, bareImport) {
	// Parse options.
	const optsModule = (state.opts || {}).module;
	if (!optsModule) {
		return;
	}
	const entry = optsModule.entry || [];
	if (!entry.length) {
		return;
	}

	// Resolve the module base, or fail.
	const {filename} = state.file.opts;
	const moduleName = bareImport.name;
	const moduleDir = resolveModuleDir(moduleName, filename);

	// Try different entry resolvers.
	let pkg = null;
	for (const info of entry) {
		const entryType = info.type;
		let filePath = null;
		let extensions = [];

		// Handle the different types.
		switch (entryType) {
			case 'package.json': {
				pkg = pkg || readJson(path.join(moduleDir, 'package.json'));
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
		const resolved = resolveExtension(resolveBase, extensions);
		if (resolved === null) {
			continue;
		}

		// Update path and finish.
		const {source} = nodePath.node;
		source.value += `/${trimDotSlash(filePath)}${resolved}`;
		break;
	}
}

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
		visitDeclarationPath(nodePath, state);
		return;
	}

	// Check if bare import (a module or submodule).
	const bareImport = importBareParse(src);
	if (bareImport) {
		if (bareImport.path) {
			visitDeclarationBarePath(nodePath, state, bareImport);
		}
		else {
			visitDeclarationBareMain(nodePath, state, bareImport);
		}
		return;
	}
}

// eslint-disable-next-line arrow-body-style
export default () => {
	return {
		visitor: {
			ImportDeclaration(path, state) {
				visitDeclaration(path, state);
			},
			ExportAllDeclaration(path, state) {
				visitDeclaration(path, state);
			},
			ExportNamedDeclaration(path, state) {
				visitDeclaration(path, state);
			}
		}
	};
};

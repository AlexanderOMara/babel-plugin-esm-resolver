import fs from 'fs';
import path from 'path';

import getRequire from 'node-require-function';

function pathStat(path) {
	try {
		// eslint-disable-next-line no-sync
		return fs.statSync(path);
	}
	catch (err) {
		return null;
	}
}

function importPathIsUrl(path) {
	return /^[^/]+:\/\//.test(path);
}

function importPathIsFile(path) {
	return path === '.' || path === '..' || /^\.?\.?\//.test(path);
}

function parseModulePath(path) {
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

function optExtentions(opts) {
	return (opts.extensions || []).map(e => {
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
	});
}

function optIgnoreUnresolved(opts) {
	return opts.ignoreUnresolved || false;
}

function resolveModuleDir(name) {
	const require = getRequire();
	if (!require || typeof require.resolve !== 'function') {
		throw new Error('Failed to get node require function');
	}
	const resolved = require.resolve(name);
	let r = resolved;
	while (path.basename(r) !== 'node_modules') {
		r = path.dirname(r);
		if (!/node_modules/.test(r)) {
			return null;
		}
	}
	return `${r}/${name}`;
}

function resolveExtension(base, extensions) {
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
		for (const {srcs, dst} of extensions) {
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

function visitDeclarationFilePath(nodePath, state) {
	const {source} = nodePath.node;
	const src = source.value;

	// Parse options.
	const opts = state.opts || {};
	const extensions = optExtentions(opts);
	const ignoreUnresolved = optIgnoreUnresolved(opts);

	// Resolve the file base.
	const {filename} = state.file.opts;
	const resolveBase = path.join(path.dirname(filename), src);

	// Resolve from the base.
	const resolved = resolveExtension(resolveBase, extensions);
	if (resolved === null) {
		if (!ignoreUnresolved) {
			throw new Error(`Failed to resolve path: ${resolveBase}`);
		}
	}
	else {
		source.value += resolved;
	}
}

function visitDeclarationModulePath(nodePath, state, modulePath) {
	// Parse options.
	const opts = state.opts || {};
	const extensions = optExtentions(opts);
	const ignoreUnresolved = optIgnoreUnresolved(opts);

	// Resolve the module base.
	const moduleName = modulePath.name;
	const moduleDir = resolveModuleDir(moduleName);
	if (!moduleDir) {
		if (!ignoreUnresolved) {
			throw new Error(`Failed to resolve module: ${moduleName}`);
		}
		return;
	}

	// Resolve from the base.
	const resolveBase = `${moduleDir}${modulePath.path}`;
	const resolved = resolveExtension(resolveBase, extensions);
	if (resolved === null) {
		if (!ignoreUnresolved) {
			const {filename} = state.file.opts;
			throw new Error(`Failed to resolve module: ${filename}`);
		}
	}
	else {
		const {source} = nodePath.node;
		source.value += resolved;
	}
}

function visitDeclaration(nodePath, state) {
	const {source} = nodePath.node;
	if (!source) {
		return;
	}

	// Get source, check if needs resolving, and how.
	const src = source.value;
	if (importPathIsUrl(src)) {
		return;
	}
	if (importPathIsFile(src)) {
		visitDeclarationFilePath(nodePath, state);
		return;
	}
	const modulePath = parseModulePath(src);
	if (modulePath && modulePath.path) {
		visitDeclarationModulePath(nodePath, state, modulePath);
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

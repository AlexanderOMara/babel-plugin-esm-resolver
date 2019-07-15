/* eslint-env jasmine */
/* eslint max-nested-callbacks: off */

import fse from 'fs-extra';

import * as babel from '@babel/core';

import plugin from './index';

function transformFile(file, opts) {
	// eslint-disable-next-line no-sync
	const code = fse.readFileSync(file, 'utf8');
	const transform = babel.transform(code, {
		plugins: [
			[plugin, opts].filter(Boolean)
		],
		code: true,
		ast: false,
		babelrc: false,
		filename: file
	});
	return {
		codeIn: code,
		codeOut: transform.code
	};
}

function remove(path) {
	// eslint-disable-next-line no-sync
	fse.removeSync(path);
}

function outputFile(path, data) {
	// eslint-disable-next-line no-sync
	fse.outputFileSync(path, data, 'utf8');
}

function specPath(file) {
	return `spec/fixtures/${file}`;
}

function getCodePath(code) {
	// Extract the import or export path.
	const m = code.match(/(import|export)[\s\S]+from[\s\S}]+['"]([^'"]*)['"]/);
	return m ? m[2] : null;
}

describe('index', () => {
	describe('exports', () => {
		it('default', () => {
			expect(typeof plugin).toBe('function');
		});
	});

	describe('tranforms', () => {
		describe('import-mjs', () => {
			it('.mjs', () => {
				const t = transformFile(specPath('import-mjs/main.mjs'), {
					extensions: [
						'.mjs'
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.mjs');
			});
			it('.mjs -> .mjs', () => {
				const t = transformFile(specPath('import-mjs/main.mjs'), {
					extensions: [
						['.mjs', '.mjs']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.mjs');
			});
			it('.mjs -> .js', () => {
				const t = transformFile(specPath('import-mjs/main.mjs'), {
					extensions: [
						['.mjs', '.js']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.js');
			});
		});

		describe('import-js', () => {
			it('.js', () => {
				const t = transformFile(specPath('import-js/main.js'), {
					extensions: [
						'.js'
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.js');
			});
			it('.js -> .js', () => {
				const t = transformFile(specPath('import-js/main.js'), {
					extensions: [
						['.js', '.js']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.js');
			});
			it('.js -> .mjs', () => {
				const t = transformFile(specPath('import-js/main.js'), {
					extensions: [
						['.js', '.mjs']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.mjs');
			});
		});

		describe('import-ts', () => {
			it('.ts', () => {
				const t = transformFile(specPath('import-ts/main.ts'), {
					extensions: [
						'.ts'
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.ts');
			});
			it('.ts -> .js', () => {
				const t = transformFile(specPath('import-ts/main.ts'), {
					extensions: [
						['.ts', '.js']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.js');
			});
			it('.ts -> .mjs', () => {
				const t = transformFile(specPath('import-ts/main.ts'), {
					extensions: [
						['.ts', '.mjs']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.mjs');
			});
		});

		describe('export-all-mjs', () => {
			it('.mjs', () => {
				const t = transformFile(specPath('export-all-mjs/main.mjs'), {
					extensions: [
						'.mjs'
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.mjs');
			});
			it('.mjs -> .mjs', () => {
				const t = transformFile(specPath('export-all-mjs/main.mjs'), {
					extensions: [
						['.mjs', '.mjs']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.mjs');
			});
			it('.mjs -> .js', () => {
				const t = transformFile(specPath('export-all-mjs/main.mjs'), {
					extensions: [
						['.mjs', '.js']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.js');
			});
		});

		describe('export-named-mjs', () => {
			it('.mjs', () => {
				const t = transformFile(specPath('export-named-mjs/main.mjs'), {
					extensions: [
						'.mjs'
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.mjs');
			});
			it('.mjs -> .mjs', () => {
				const t = transformFile(specPath('export-named-mjs/main.mjs'), {
					extensions: [
						['.mjs', '.mjs']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.mjs');
			});
			it('.mjs -> .js', () => {
				const t = transformFile(specPath('export-named-mjs/main.mjs'), {
					extensions: [
						['.mjs', '.js']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.js');
			});
		});

		describe('search-order', () => {
			it('.mjs -> .js', () => {
				const t = transformFile(specPath('search-order/main.ts'), {
					extensions: [
						[['.ts', '.mjs', '.js'], '.js']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.js');
			});
			it('.js -> .mjs', () => {
				const t = transformFile(specPath('search-order/main.ts'), {
					extensions: [
						[['.ts', '.js', '.mjs'], '.mjs']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.mjs');
			});
			it('.ts -> .mjs', () => {
				const t = transformFile(specPath('search-order/main.ts'), {
					extensions: [
						[['.ts'], '.mjs']
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar/index.mjs');
			});
		});

		describe('unresolved', () => {
			it('throws', () => {
				expect(() => {
					transformFile(specPath('unresolved/main.mjs'), {
						extensions: [
							'.js'
						]
					});
				}).toThrow();
			});

			it('ignoreUnresolved', () => {
				const t = transformFile(specPath('unresolved/main.mjs'), {
					extensions: [
						'.js'
					],
					ignoreUnresolved: true
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar');
			});
		});

		describe('skip-full', () => {
			it('ignored', () => {
				const t = transformFile(specPath('skip-full/main.mjs'));
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar.mjs');
			});
		});

		describe('skip-full-noext', () => {
			it('ignored', () => {
				const t = transformFile(specPath('skip-full-noext/main.mjs'));
				const path = getCodePath(t.codeOut);
				expect(path).toBe('./bar');
			});
		});

		describe('skip-modules', () => {
			it('ignored', () => {
				const t = transformFile(specPath('skip-modules/main.mjs'));
				const path = getCodePath(t.codeOut);
				expect(path).toBe('bar');
			});
		});

		describe('skip-modules-ns', () => {
			it('ignored', () => {
				const t = transformFile(specPath('skip-modules-ns/main.mjs'));
				const path = getCodePath(t.codeOut);
				expect(path).toBe('@bar/core');
			});
		});

		describe('skip-url', () => {
			it('ignored', () => {
				const t = transformFile(specPath('skip-url/main.mjs'));
				const path = getCodePath(t.codeOut);
				expect(path).toBe('https://example.com/main.js');
			});
		});

		describe('resolve-module-paths', () => {
			it('changed', () => {
				remove('node_modules/-testing-module');
				outputFile(
					'node_modules/-testing-module/lib/main.js',
					'export const main = 42;'
				);
				outputFile(
					'node_modules/-testing-module/lib/bar.js',
					'export const foo = 123;'
				);
				outputFile(
					'node_modules/-testing-module/package.json',
					JSON.stringify({
						main: 'lib/main'
					}, null, '\t')
				);

				const f = specPath('resolve-module-paths/main.mjs');
				const t = transformFile(f, {
					extensionsSubmodule: [
						'.js'
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('-testing-module/lib/bar.js');

				remove('node_modules/-testing-module');
			});
		});

		describe('resolve-module-ns-paths', () => {
			it('changed', () => {
				remove('node_modules/@-testing/module');
				outputFile(
					'node_modules/@-testing/module/lib/main.js',
					'export const main = 42;'
				);
				outputFile(
					'node_modules/@-testing/module/lib/bar.js',
					'export const foo = 123;'
				);
				outputFile(
					'node_modules/@-testing/module/package.json',
					JSON.stringify({
						main: 'lib/main'
					}, null, '\t')
				);

				const f = specPath('resolve-module-ns-paths/main.mjs');
				const t = transformFile(f, {
					extensionsSubmodule: [
						'.js'
					]
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('@-testing/module/lib/bar.js');

				remove('node_modules/@-testing/module');
			});
		});

		describe('unresolve-module-paths', () => {
			it('throws', () => {
				expect(() => {
					const f = specPath('unresolved-module-paths/main.mjs');
					transformFile(f, {
						extensions: [
							'.js'
						]
					});
				}).toThrow();
			});

			it('ignoreUnresolved', () => {
				const f = specPath('unresolved-module-paths/main.mjs');
				const t = transformFile(f, {
					ignoreUnresolved: true
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('-testing-module/lib/bar');
			});
		});

		describe('unresolve-module-ns-paths', () => {
			it('throws', () => {
				expect(() => {
					const f = specPath('unresolved-module-ns-paths/main.mjs');
					transformFile(f, {
						extensions: [
							'.js'
						]
					});
				}).toThrow();
			});

			it('ignoreUnresolved', () => {
				const f = specPath('unresolved-module-ns-paths/main.mjs');
				const t = transformFile(f, {
					ignoreUnresolved: true
				});
				const path = getCodePath(t.codeOut);
				expect(path).toBe('@-testing/module/lib/bar');
			});
		});
	});
});

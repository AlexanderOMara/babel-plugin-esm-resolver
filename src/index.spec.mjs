/* eslint-env jasmine */
/* eslint max-nested-callbacks: off */

import fse from 'fs-extra';

import * as babel from '@babel/core';

import plugin from './index';

function listDirs(path) {
	// eslint-disable-next-line no-sync
	return fse.readdirSync(path)
		.filter(s => !/!\./.test(s))
		// eslint-disable-next-line no-sync
		.filter(s => fse.statSync(`${path}/${s}`).isDirectory())
		.sort();
}

function listTransforms() {
	const r = [];

	const base = 'spec/fixtures/transforms';
	const groups = listDirs(base);
	for (const group of groups) {
		const testGroup = {
			name: group,
			tests: []
		};

		const groupBase = `${base}/${group}`;
		const subgroups = listDirs(groupBase);
		for (const subgroup of subgroups) {
			const subgroupBase = `${groupBase}/${subgroup}`;
			let tests;
			try {
				// eslint-disable-next-line no-sync
				tests = fse.readJsonSync(`${subgroupBase}/tests.json`);
			}
			catch (err) {
				continue;
			}

			const testSubgroup = {
				name: subgroup,
				tests: []
			};

			for (const info of tests) {
				const file = `${subgroupBase}/${info.file}`;
				const test = {
					name: info.name,
					file,
					path: info.path || null,
					options: info.options || null,
					'throws': info.throws || null,
					module: info.module ? {
						src: `${subgroupBase}/${info.module}`,
						dest: `node_modules/${info.module}`
					} : null
				};
				testSubgroup.tests.push(test);
			}
			testGroup.tests.push(testSubgroup);
		}
		r.push(testGroup);
	}
	return r;
}

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

function extractCodePath(code) {
	// Extract the import or export path.
	const m = code.match(/(import|export)[\s\S]+from[\s\S}]+['"]([^'"]*)['"]/);
	return m ? m[2] : null;
}

function transformTest(info) {
	const {module} = info;
	try {
		if (module) {
			// eslint-disable-next-line no-sync
			fse.copySync(module.src, module.dest);
		}
		try {
			const t = transformFile(info.file, info.options);
			const path = extractCodePath(t.codeOut);
			if (info.path) {
				expect(path).toBe(info.path);
			}
		}
		catch (err) {
			if (info.throws) {
				expect(err.message.includes(info.throws)).toBe(true);
			}
			else {
				throw err;
			}
		}
	}
	finally {
		if (module) {
			// eslint-disable-next-line no-sync
			fse.removeSync(module.dest);
		}
	}
}

describe('index', () => {
	describe('exports', () => {
		it('default', () => {
			expect(typeof plugin).toBe('function');
		});
	});

	describe('tranforms', () => {
		for (const group of listTransforms()) {
			describe(group.name, () => {
				for (const subgroup of group.tests) {
					describe(subgroup.name, () => {
						for (const test of subgroup.tests) {
							it(test.name, () => {
								transformTest(test);
							});
						}
					});
				}
			});
		}
	});
});

import {ok, strictEqual} from 'assert';
import fs from 'fs';

import * as babel from '@babel/core';

import plugin from './index';

function listDirs(path) {
	return (
		// eslint-disable-next-line no-sync
		fs
			.readdirSync(path)
			.filter(s => !/!\./.test(s))
			// eslint-disable-next-line no-sync
			.filter(s => fs.statSync(`${path}/${s}`).isDirectory())
			.sort()
	);
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
				tests = fs.readFileSync(`${subgroupBase}/tests.json`, 'utf8');
				// eslint-disable-next-line no-unused-vars
			} catch (err) {
				continue;
			}

			const testSubgroup = {
				name: subgroup,
				tests: []
			};

			for (const info of JSON.parse(tests)) {
				testSubgroup.tests.push({
					name: info.name,
					file: `${subgroupBase}/${info.file}`,
					path: info.path || null,
					options: info.options || null,
					throws: info.throws || null
				});
			}
			testGroup.tests.push(testSubgroup);
		}
		r.push(testGroup);
	}
	return r;
}

function transformFile(file, opts) {
	// eslint-disable-next-line no-sync
	const code = fs.readFileSync(file, 'utf8');
	const transform = babel.transform(code, {
		plugins: [[plugin, opts].filter(Boolean)],
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

function transformTest(group, subgroup, test) {
	const pre = `${group.name} > ${subgroup.name} > ${test.name}`;
	try {
		const t = transformFile(test.file, test.options);
		const path = extractCodePath(t.codeOut);
		if (test.path) {
			strictEqual(path, test.path, `${pre}: path`);
		}
	} catch (err) {
		if (test.throws) {
			ok(err.message.includes(test.throws), `${pre}: throws`);
		} else {
			throw err;
		}
	}
}

strictEqual(typeof plugin, 'function', 'Export function');

for (const group of listTransforms()) {
	for (const subgroup of group.tests) {
		for (const test of subgroup.tests) {
			transformTest(group, subgroup, test);
		}
	}
}

import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { AtomicFileStore, JsonFileStore } from '@oullin/herdr-plugin-core';

describe('atomic persistence', () => {
	it('writes text and JSON through atomic replacements', () => {
		const directory = mkdtempSync(
			join(
				tmpdir(),
				'herdr-plugin-core-',
			),
		);

		const textPath = join(directory, 'nested', 'value.txt');
		const jsonPath = join(directory, 'state.json');
		const files = new AtomicFileStore();
		const json = new JsonFileStore(files);

		files.write(textPath, 'value\n', 0o640);
		json.write(jsonPath, { enabled: true });

		expect(
			files.read(textPath),
		).toBe('value\n');
		expect(statSync(textPath).mode & 0o777).toBe(0o640);
		expect(
			json.read(jsonPath),
		).toEqual({ enabled: true });
		expect(
			readFileSync(jsonPath, 'utf8'),
		).toBe('{\n  "enabled": true\n}\n');
	});
});

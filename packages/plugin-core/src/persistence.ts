import { existsSync, mkdirSync, readFileSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

export class AtomicFileStore {
	exists(path: string): boolean {
		return existsSync(path);
	}

	read(path: string): string | undefined {
		return existsSync(path) ? readFileSync(path, 'utf8') : undefined;
	}

	mode(path: string, fallback = 0o600): number {
		return existsSync(path) ? statSync(path).mode : fallback;
	}

	write(path: string, content: string, mode = 0o600): void {
		mkdirSync(
			dirname(path),
			{ recursive: true },
		);

		const temporaryPath = join(
			dirname(path),
			`.${basename(path)}.${process.pid}.tmp`,
		);

		writeFileSync(
			temporaryPath,
			content,
			{ encoding: 'utf8', mode },
		);
		renameSync(temporaryPath, path);
	}

	delete(path: string): void {
		if (existsSync(path)) {
			unlinkSync(path);
		}
	}
}

export class JsonFileStore {
	private readonly files: AtomicFileStore;

	constructor(files: AtomicFileStore = new AtomicFileStore()) {
		this.files = files;
	}

	read<T>(path: string): T | undefined {
		const content = this.files.read(path)?.trim();

		return content ? (JSON.parse(content) as T) : undefined;
	}

	write(path: string, value: unknown): void {
		const content = value === undefined ? '' : `${JSON.stringify(value, null, 2)}\n`;

		this.files.write(path, content);
	}
}

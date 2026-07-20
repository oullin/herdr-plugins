import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
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

		try {
			renameSync(temporaryPath, path);
		} catch (error) {
			try {
				rmSync(
					temporaryPath,
					{ force: true },
				);
			} catch {
				// Keep the original rename failure.
			}

			throw error;
		}
	}

	delete(path: string): void {
		rmSync(
			path,
			{ force: true },
		);
	}
}

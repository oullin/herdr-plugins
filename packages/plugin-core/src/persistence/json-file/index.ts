import { AtomicFileStore } from '#herdr-plugin-core/persistence/atomic-file';

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

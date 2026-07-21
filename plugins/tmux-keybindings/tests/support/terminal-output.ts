const ansiReset = `${String.fromCodePoint(0x1b)}[0m`;
const ansiSequencePattern = new RegExp(`${String.fromCodePoint(0x1b)}\\[[0-9;]*m`, 'gu');

/** Provides immutable textual and terminal-style views of rendered output. */
export class TerminalOutput {
	private readonly rawValue: string;
	private readonly rawRowsValue: readonly string[];
	private readonly rowsValue: readonly string[];

	private constructor(rawValue: string, rawRowsValue: readonly string[], rowsValue: readonly string[]) {
		this.rawValue = rawValue;
		this.rawRowsValue = rawRowsValue;
		this.rowsValue = rowsValue;
	}

	/** Creates terminal output assertions from an ANSI-rendered value. */
	static from(value: string): TerminalOutput {
		const rawRows = Object.freeze(value.split('\n'));
		const rows = Object.freeze(rawRows.map((row) => row.replace(ansiSequencePattern, '')));

		return new TerminalOutput(value, rawRows, rows);
	}

	/** Returns rendered rows with ANSI sequences removed. */
	get rows(): readonly string[] {
		return this.rowsValue;
	}

	/** Returns the Unicode code-point width of every unstyled row. */
	get visibleWidths(): readonly number[] {
		return Object.freeze(this.rowsValue.map((row) => Array.from(row).length));
	}

	/** Reports whether the raw output includes an ANSI sequence. */
	hasAnsiSequence(sequence: string): boolean {
		return this.rawValue.includes(sequence);
	}

	/** Reports whether text immediately follows a required ANSI style sequence. */
	hasStyledText(sequence: string, text: string): boolean {
		return this.rawValue.includes(`${sequence}${text}`);
	}

	/** Reports whether every raw row safely resets terminal state. */
	everyRowEndsWithReset(): boolean {
		return this.rawRowsValue.every((row) => row.endsWith(ansiReset));
	}
}

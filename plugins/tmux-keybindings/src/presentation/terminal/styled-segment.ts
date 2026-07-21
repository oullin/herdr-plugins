/** Immutable terminal text with explicit foreground, background, and emphasis. */
export class StyledSegment {
	private readonly textValue: string;
	private readonly foregroundValue: string;
	private readonly backgroundValue: string;
	private readonly emphasizedValue: boolean;

	private constructor(textValue: string, foregroundValue: string, backgroundValue: string, emphasizedValue: boolean) {
		this.textValue = textValue;
		this.foregroundValue = foregroundValue;
		this.backgroundValue = backgroundValue;
		this.emphasizedValue = emphasizedValue;
	}

	/** Creates a styled terminal-text segment. */
	static from(text: string, foreground: string, background: string, emphasized: boolean): StyledSegment {
		return new StyledSegment(text, foreground, background, emphasized);
	}

	/** Returns the unstyled text. */
	get text(): string {
		return this.textValue;
	}

	/** Returns the foreground colour. */
	get foreground(): string {
		return this.foregroundValue;
	}

	/** Returns the background colour. */
	get background(): string {
		return this.backgroundValue;
	}

	/** Reports whether the segment is emphasized. */
	get emphasized(): boolean {
		return this.emphasizedValue;
	}
}

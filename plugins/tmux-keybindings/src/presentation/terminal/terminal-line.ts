import type { StyledSegment } from '#tmux-keybindings/presentation/terminal/styled-segment';

const escape = String.fromCodePoint(0x1b);

/** Renders immutable styled segments to one fixed-width terminal row. */
export class TerminalLine {
	private readonly segments: readonly StyledSegment[];
	private readonly width: number;
	private readonly background: string;

	private constructor(segments: readonly StyledSegment[], width: number, background: string) {
		this.segments = segments;
		this.width = width;
		this.background = background;
	}

	/** Creates a fixed-width terminal row from concrete styled segments. */
	static from(segments: readonly StyledSegment[], width: number, background: string): TerminalLine {
		return new TerminalLine(Object.freeze([...segments]), width, background);
	}

	/** Renders ANSI styling after measuring, truncating, and padding unstyled code points. */
	render(): string {
		const renderedSegments: string[] = [];

		let visibleWidth = 0;

		for (const segment of this.segments) {
			const remainingWidth = this.width - visibleWidth;

			if (remainingWidth <= 0) {
				break;
			}

			const text = this.truncate(segment.text, remainingWidth);

			if (text.length === 0) {
				continue;
			}

			renderedSegments.push(this.renderSegment(segment, text));
			visibleWidth += this.visibleWidth(text);
		}

		const padding = ' '.repeat(Math.max(0, this.width - visibleWidth));

		return `${renderedSegments.join('')}${this.backgroundSequence(this.background)}${padding}${escape}[0m`;
	}

	private renderSegment(segment: StyledSegment, text: string): string {
		const emphasis = segment.emphasized ? `${escape}[1m` : `${escape}[22m`;

		return `${this.backgroundSequence(segment.background)}${emphasis}${this.foregroundSequence(segment.foreground)}${text}`;
	}

	private visibleWidth(value: string): number {
		return Array.from(value).length;
	}

	private truncate(value: string, width: number): string {
		const codePoints = Array.from(value);

		if (codePoints.length <= width) {
			return value;
		}

		if (width === 1) {
			return '…';
		}

		return `${codePoints.slice(0, Math.max(0, width - 1)).join('')}…`;
	}

	private foregroundSequence(colour: string): string {
		const [red, green, blue] = this.parseColour(colour);

		return `${escape}[38;2;${red};${green};${blue}m`;
	}

	private backgroundSequence(colour: string): string {
		const [red, green, blue] = this.parseColour(colour);

		return `${escape}[48;2;${red};${green};${blue}m`;
	}

	private parseColour(colour: string): readonly [number, number, number] {
		const hexadecimal = colour.startsWith('#') ? colour.slice(1) : colour;

		if (!/^[0-9a-f]{6}$/iu.test(hexadecimal)) {
			return [0, 0, 0];
		}

		return [Number.parseInt(hexadecimal.slice(0, 2), 16), Number.parseInt(hexadecimal.slice(2, 4), 16), Number.parseInt(hexadecimal.slice(4, 6), 16)];
	}
}

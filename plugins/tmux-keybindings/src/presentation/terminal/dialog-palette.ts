/** Immutable colours used to render the tmux keybindings dialog. */
export class DialogPalette {
	private readonly backgroundValue: string;
	private readonly primaryTextValue: string;
	private readonly mutedTextValue: string;
	private readonly sectionHeadingValue: string;
	private readonly shortcutValue: string;
	private readonly closeBadgeBackgroundValue: string;
	private readonly closeBadgeTextValue: string;

	private constructor(
		backgroundValue: string,
		primaryTextValue: string,
		mutedTextValue: string,
		sectionHeadingValue: string,
		shortcutValue: string,
		closeBadgeBackgroundValue: string,
		closeBadgeTextValue: string,
	) {
		this.backgroundValue = backgroundValue;
		this.primaryTextValue = primaryTextValue;
		this.mutedTextValue = mutedTextValue;
		this.sectionHeadingValue = sectionHeadingValue;
		this.shortcutValue = shortcutValue;
		this.closeBadgeBackgroundValue = closeBadgeBackgroundValue;
		this.closeBadgeTextValue = closeBadgeTextValue;
	}

	/** Creates the tmux help-dialog palette. */
	static tmux(): DialogPalette {
		return new DialogPalette('#1a1b26', '#c0caf5', '#737aa2', '#7dcfff', '#bb9af7', '#7aa2f7', '#1a1b26');
	}

	/** Returns the dialog background colour. */
	get background(): string {
		return this.backgroundValue;
	}

	/** Returns the primary text colour. */
	get primaryText(): string {
		return this.primaryTextValue;
	}

	/** Returns the muted text colour. */
	get mutedText(): string {
		return this.mutedTextValue;
	}

	/** Returns the section-heading colour. */
	get sectionHeading(): string {
		return this.sectionHeadingValue;
	}

	/** Returns the shortcut colour. */
	get shortcut(): string {
		return this.shortcutValue;
	}

	/** Returns the close-badge background colour. */
	get closeBadgeBackground(): string {
		return this.closeBadgeBackgroundValue;
	}

	/** Returns the close-badge text colour. */
	get closeBadgeText(): string {
		return this.closeBadgeTextValue;
	}
}

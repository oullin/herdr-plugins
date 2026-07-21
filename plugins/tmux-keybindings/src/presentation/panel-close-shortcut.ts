const controlB = 0x02;
const controlC = 0x03;
const escape = 0x1b;
const lowerQ = 0x71;
const upperQ = 0x51;

export class PanelCloseShortcut {
	private prefixPressed = false;

	accept(input: Uint8Array): boolean {
		for (const byte of input) {
			if (byte === escape || byte === controlC) {
				return true;
			}

			if (this.prefixPressed) {
				this.prefixPressed = byte === controlB;

				if (byte === lowerQ || byte === upperQ) {
					return true;
				}

				continue;
			}

			this.prefixPressed = byte === controlB;
		}

		return false;
	}
}

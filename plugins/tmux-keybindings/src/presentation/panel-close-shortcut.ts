const controlB = 0x02;
const controlC = 0x03;
const escape = 0x1b;
const questionMark = 0x3f;

export class PanelCloseShortcut {
	private prefixPressed = false;

	accept(input: Uint8Array): boolean {
		for (const byte of input) {
			if (byte === escape || byte === controlC) {
				return true;
			}

			if (this.prefixPressed) {
				this.prefixPressed = byte === controlB;

				if (byte === questionMark) {
					return true;
				}

				continue;
			}

			this.prefixPressed = byte === controlB;
		}

		return false;
	}
}

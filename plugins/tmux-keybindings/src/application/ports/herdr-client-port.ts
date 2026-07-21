import type { ConfigClient } from '@oullin/herdr-plugin-core';

export interface HerdrClientPort extends ConfigClient {
	openBindingsPopup(): void;
}

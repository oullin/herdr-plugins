import type { HerdrCliTransport } from '#herdr-plugin-core/herdr-cli/transport';
import type { ConfigClient } from '#herdr-plugin-core/ports';

export class HerdrConfigClient implements ConfigClient {
	private readonly transport: HerdrCliTransport;

	constructor(transport: HerdrCliTransport) {
		this.transport = transport;
	}

	validateConfig(configPath: string): void {
		this.transport.run(['config', 'check'], { ...process.env, HERDR_CONFIG_PATH: configPath });
	}

	reloadConfig(): void {
		this.transport.run(['server', 'reload-config']);
	}
}

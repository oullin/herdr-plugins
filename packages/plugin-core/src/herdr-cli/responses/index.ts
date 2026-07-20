import { HerdrCommandError } from '#herdr-plugin-core/errors';
import { isJsonObject } from '#herdr-plugin-core/json';
import type { JsonObject } from '#herdr-plugin-core/models';

export interface HerdrApiError {
	readonly code?: string;
	readonly message?: string;
}

export class HerdrResponseDecoder {
	decodeResult(stdout: string, command: string): JsonObject {
		const response = this.parseJson(stdout, `${command} returned malformed JSON`);

		if (!isJsonObject(response)) {
			throw new HerdrCommandError(`${command} returned an invalid response`);
		}

		if ('error' in response) {
			const apiError = this.apiError(response['error']);
			const message = apiError?.message ?? JSON.stringify(response['error']);

			throw new HerdrCommandError(`${command} failed: ${message}`, { code: apiError?.code });
		}

		const result = response['result'];

		if (!isJsonObject(result)) {
			throw new HerdrCommandError(`${command} returned no result`);
		}

		return result;
	}

	decodeError(rawError: string): HerdrApiError | undefined {
		if (rawError.length === 0) {
			return undefined;
		}

		try {
			const response = JSON.parse(rawError) as unknown;

			return isJsonObject(response) ? this.apiError(response['error']) : undefined;
		} catch {
			return undefined;
		}
	}

	private apiError(value: unknown): HerdrApiError | undefined {
		if (!isJsonObject(value)) {
			return undefined;
		}

		const code = value['code'];
		const message = value['message'];

		return {
			...(typeof code === 'string' ? { code } : {}),
			...(typeof message === 'string' ? { message } : {}),
		};
	}

	private parseJson(value: string, errorMessage: string): unknown {
		try {
			return JSON.parse(value) as unknown;
		} catch (error) {
			throw new HerdrCommandError(errorMessage, { cause: error });
		}
	}
}

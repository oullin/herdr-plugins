import type { JsonObject } from '#herdr-plugin-core/models';

export function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

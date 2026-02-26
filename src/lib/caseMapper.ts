/**
 * Automated camelCase ↔ snake_case mapping utilities.
 *
 * Eliminates manual field-by-field mapping between the frontend
 * (camelCase) and Postgres (snake_case) naming conventions.
 */

/** Convert a camelCase string to snake_case. */
export function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** Convert a snake_case string to camelCase. */
export function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively convert all keys of an object from camelCase to snake_case.
 * Arrays are traversed but their elements are converted individually.
 */
export function keysToSnake<T = Record<string, unknown>>(obj: unknown): T {
    if (Array.isArray(obj)) {
        return obj.map((item) => keysToSnake(item)) as unknown as T;
    }
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        const converted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            converted[toSnakeCase(key)] = keysToSnake(value);
        }
        return converted as T;
    }
    return obj as T;
}

/**
 * Recursively convert all keys of an object from snake_case to camelCase.
 * Arrays are traversed but their elements are converted individually.
 */
export function keysToCamel<T = Record<string, unknown>>(obj: unknown): T {
    if (Array.isArray(obj)) {
        return obj.map((item) => keysToCamel(item)) as unknown as T;
    }
    if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        const converted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            converted[toCamelCase(key)] = keysToCamel(value);
        }
        return converted as T;
    }
    return obj as T;
}

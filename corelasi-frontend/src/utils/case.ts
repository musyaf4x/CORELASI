/**
 * @file src/utils/case.ts
 * @description Case conversion utilities (camelCase <-> snake_case) for backend API payload integration.
 */

/** Check if a value is a plain object */
function isObject(val: unknown): val is Record<string, unknown> {
  return (
    val !== null &&
    typeof val === "object" &&
    !Array.isArray(val) &&
    !(val instanceof Date)
  );
}

/** Convert a string from camelCase to snake_case */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/** Convert a string from snake_case to camelCase */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/** Recursively convert object keys from camelCase to snake_case */
export function camelToSnake<T = unknown>(val: unknown): T {
  if (Array.isArray(val)) {
    return val.map(camelToSnake) as unknown as T;
  }
  if (isObject(val)) {
    const res: Record<string, unknown> = {};
    for (const key of Object.keys(val)) {
      res[toSnakeCase(key)] = camelToSnake(val[key]);
    }
    return res as T;
  }
  return val as T;
}

/** Recursively convert object keys from snake_case to camelCase */
export function snakeToCamel<T = unknown>(val: unknown): T {
  if (Array.isArray(val)) {
    return val.map(snakeToCamel) as unknown as T;
  }
  if (isObject(val)) {
    const res: Record<string, unknown> = {};
    for (const key of Object.keys(val)) {
      res[toCamelCase(key)] = snakeToCamel(val[key]);
    }
    return res as T;
  }
  return val as T;
}

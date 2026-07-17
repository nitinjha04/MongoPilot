/**
 * Parse MongoDB Compass / shell-style filter queries into plain objects.
 * Supports JSON5 plus helpers like ObjectId("..."), ISODate("...").
 */

import JSON5 from 'json5';

/**
 * Rewrite mongo-shell constructors into Extended JSON before JSON5.parse.
 */
export function preprocessMongoShellFilter(input: string): string {
  return input
    .replace(
      /ObjectId\s*\(\s*["']([a-fA-F0-9]{24})["']\s*\)/g,
      '{"$oid":"$1"}'
    )
    .replace(
      /ISODate\s*\(\s*["']([^"']+)["']\s*\)/g,
      '{"$date":"$1"}'
    )
    .replace(/NumberInt\s*\(\s*(-?\d+)\s*\)/g, '$1')
    .replace(
      /NumberLong\s*\(\s*["']?(-?\d+)["']?\s*\)/g,
      '{"$numberLong":"$1"}'
    );
}

export type ParseFilterResult =
  | { ok: true; filter: Record<string, unknown>; normalized: string }
  | { ok: false; error: string };

export function parseMongoFilterQuery(query: string): ParseFilterResult {
  const trimmed = query.trim() || '{}';

  try {
    const preprocessed = preprocessMongoShellFilter(trimmed);
    const parsed = JSON5.parse(preprocessed);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ok: false, error: 'Filter must be an object' };
    }

    return {
      ok: true,
      filter: parsed as Record<string, unknown>,
      normalized: JSON.stringify(parsed),
    };
  } catch {
    return { ok: false, error: 'Invalid filter syntax' };
  }
}

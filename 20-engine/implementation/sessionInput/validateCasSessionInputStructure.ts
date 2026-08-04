/**
 * Combat Athlete System — Public Input Structural Guard
 * Version 1 ("cas-session-input.v1")
 *
 * The one thing the public entry point must never do is throw on data a
 * client sent.
 *
 * `adaptCasSessionInput` is a pure projection and deliberately does not
 * validate — `validateEngineInput` is the single validation authority for
 * FIELD-LEVEL rules (ranges, clearances, contradictions), and duplicating
 * those here would create a second, drifting rulebook. But that authority
 * runs inside `runEngine`, and the adapter has to read the object first.
 * A payload missing `athleteProfile` entirely therefore used to crash the
 * projection with a raw `TypeError` before any validation could report it.
 *
 * That is not a field-level rule and this file does not add one. It answers
 * a narrower, purely structural question: is this object SHAPED like a
 * `CasSessionInputV1` at all — are the six sections present and of the right
 * kind, and are the collections the adapter iterates actually arrays? A
 * payload that fails here could not be projected at all; a payload that
 * passes is handed to the real validator unchanged and judged there.
 *
 * Every issue uses `MISSING_REQUIRED_FIELD`, which already exists in the
 * public `ValidationErrorCode` vocabulary, so a consumer needs no new code
 * path: a structurally malformed request comes back as
 * `outcome: "invalid_input"` exactly like a semantically invalid one.
 */

import type { ValidationIssue } from "../types";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The six sections `adaptCasSessionInput` dereferences unconditionally. */
const REQUIRED_SECTIONS = [
  "athleteProfile",
  "medicalState",
  "readiness",
  "trainingHistory",
  "environment",
  "request",
] as const;

/**
 * Nested members the adapter calls `.map()` on. A non-array here throws just
 * as surely as a missing section, so both are caught by the same pass.
 */
const REQUIRED_ARRAYS: readonly { path: string; section: string; key: string }[] = [
  { path: "athleteProfile.goals", section: "athleteProfile", key: "goals" },
  { path: "medicalState.painReports", section: "medicalState", key: "painReports" },
  { path: "medicalState.restrictions", section: "medicalState", key: "restrictions" },
  { path: "trainingHistory.recentSessions", section: "trainingHistory", key: "recentSessions" },
  { path: "environment.availableEquipment", section: "environment", key: "availableEquipment" },
];

const missingField = (path: string, message: string): ValidationIssue => ({
  code: "MISSING_REQUIRED_FIELD",
  path,
  message,
  severity: "critical",
});

/**
 * Structural issues that would prevent `adaptCasSessionInput` from running.
 *
 * Empty means "projectable", never "valid" — field-level validity is
 * `validateEngineInput`'s answer, given after the projection. Issues are
 * returned in a fixed order (sections, then nested arrays, each in
 * declaration order) so the same malformed payload always reports the same
 * list.
 */
export function findCasSessionInputStructuralIssues(input: unknown): ValidationIssue[] {
  if (!isObject(input)) {
    return [
      missingField(
        "",
        `A "cas-session-input.v1" payload must be an object, but received ${input === null ? "null" : typeof input}.`,
      ),
    ];
  }

  const issues: ValidationIssue[] = [];

  for (const section of REQUIRED_SECTIONS) {
    if (!isObject(input[section])) {
      issues.push(missingField(section, `Required section "${section}" is missing or is not an object.`));
    }
  }

  for (const { path, section, key } of REQUIRED_ARRAYS) {
    const parent = input[section];
    if (!isObject(parent)) {
      // Already reported as a missing section; do not report it twice.
      continue;
    }
    if (!Array.isArray(parent[key])) {
      issues.push(missingField(path, `Required field "${path}" is missing or is not an array.`));
    }
  }

  return issues;
}

/**
 * A request identifier safe to echo back for a payload that may be malformed
 * in any way, used only to build the trace id of an `invalid_input` result.
 * Never invents a value the caller could mistake for their own.
 */
export function readRequestIdForDiagnostics(input: unknown): string {
  if (!isObject(input)) {
    return "unknown_request";
  }
  const request = input["request"];
  if (!isObject(request)) {
    return "unknown_request";
  }
  const requestId = request["requestId"];
  return typeof requestId === "string" && requestId.length > 0 ? requestId : "unknown_request";
}

/**
 * A timestamp safe to use for the trace entry of a malformed payload. Falls
 * back to the caller-supplied `generatedAt` rather than reading a clock,
 * preserving the engine's no-wall-clock rule.
 */
export function readRequestedAtForDiagnostics(input: unknown, fallback: string): string {
  if (!isObject(input)) {
    return fallback;
  }
  const request = input["request"];
  if (!isObject(request)) {
    return fallback;
  }
  const requestedAt = request["requestedAt"];
  return typeof requestedAt === "string" && requestedAt.length > 0 ? requestedAt : fallback;
}

/**
 * Combat Athlete System — Athlete Reference Derivation
 * Version 0.1
 *
 * Selects which of the athlete's recorded performance references the
 * prescription layer may use for this request.
 *
 * A reference is a MEASURED FACT about the athlete (a tested one-rep max, a
 * training max, a baseline velocity) — the kind of thing the platform
 * legitimately records and supplies. What is NOT a platform decision is
 * which references are still usable today, and CAS makes that call here.
 *
 * WHAT THIS FILE REFUSES TO DO, and why it matters more than what it does:
 *
 * - it never estimates a one-rep max from training history. The engine has
 *   `CompletedExerciseSummary.loadKg` and `repetitionsCompleted`, so an
 *   Epley- or Brzycki-style estimate is mechanically possible, and no
 *   document in this repository specifies one. Inventing a formula would
 *   put a fabricated number underneath every `percentage_1rm` prescription
 *   in the registry, which is exactly the class of invention the project
 *   forbids;
 * - it never substitutes one reference type for another (a training max is
 *   not a one-rep max, and `athleteReferenceCatalog.ts` keeps the nine
 *   types distinct);
 * - it never fabricates a reference to make an exercise prescribable. An
 *   exercise whose reference is missing reports
 *   `REQUIRED_ATHLETE_REFERENCE_MISSING`, and Lot 1's disclosure surfaces
 *   it as a selected-but-unprescribed exercise. Saying "no data" is a
 *   correct answer; guessing is not.
 */

import type { EngineInput, Identifier } from "../types";
import type { IntensityReference } from "./types";

// -----------------------------------------------------------------------------
// Result
// -----------------------------------------------------------------------------

export type AthleteReferenceRejectionCode = "EXPIRED";

export interface RejectedAthleteReference {
  referenceType: IntensityReference["referenceType"];
  sourceId: Identifier;
  code: AthleteReferenceRejectionCode;
  reason: string;
}

export interface AthleteReferenceDecision {
  /** The references the prescription layer may use, in the order the athlete recorded them. */
  references: readonly IntensityReference[];
  /** Recorded references deliberately excluded, each with its reason — never silently dropped. */
  rejected: readonly RejectedAthleteReference[];
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * The athlete's usable performance references for this request.
 *
 * Only one rule is applied, and it is the one the data model already asks
 * for: a reference whose `validUntil` is strictly before the request date is
 * expired and is not used. `IntensityReference.validUntil` exists precisely
 * to express that a measurement goes stale, and dosing a working set from a
 * max the athlete no longer holds is the failure mode it guards against.
 * `validUntil: null` means no expiry was recorded and the reference is kept.
 *
 * Deterministic and pure: order is preserved from the input, no clock is
 * read (the comparison date is `input.request.requestedAt`), and nothing is
 * mutated.
 */
export function deriveAthleteReferences(input: EngineInput): AthleteReferenceDecision {
  const recorded = input.athleteProfile.performanceReferences ?? [];
  const requestedAtMs = new Date(input.request.requestedAt).getTime();

  const references: IntensityReference[] = [];
  const rejected: RejectedAthleteReference[] = [];

  for (const reference of recorded) {
    if (isExpired(reference, requestedAtMs)) {
      rejected.push({
        referenceType: reference.referenceType,
        sourceId: reference.sourceId,
        code: "EXPIRED",
        reason: `Reference "${reference.sourceId}" (${reference.referenceType}) expired on ${reference.validUntil} and is not used for a session requested on ${input.request.requestedAt}.`,
      });
      continue;
    }
    references.push(reference);
  }

  return { references, rejected };
}

/**
 * `validUntil === null` is "no expiry recorded", never "expired". An
 * unparseable date is treated as NOT expired: dropping a reference on a
 * malformed field would silently change the dose, and malformed input is
 * `validation.ts`'s concern rather than something to act on here.
 */
function isExpired(reference: IntensityReference, requestedAtMs: number): boolean {
  if (reference.validUntil === null) {
    return false;
  }
  const validUntilMs = new Date(reference.validUntil).getTime();
  if (Number.isNaN(validUntilMs) || Number.isNaN(requestedAtMs)) {
    return false;
  }
  return validUntilMs < requestedAtMs;
}

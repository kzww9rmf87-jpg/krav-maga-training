/**
 * Combat Athlete System — Source-Rule Identifier Convention
 * Version 0.1
 *
 * Two conventions for `sourceRuleIds` already coexist in the prescription
 * layer:
 *
 * - engine documents: `<doc_number>_<DOC_NAME>_V0_1`, e.g.
 *   `"31_TRAINING_METHOD_CATALOGUE_V0_1"` (`contracts.ts`,
 *   `prescriptionKnowledge.ts`);
 * - exercise chapters: a `50-exercises/...` path, e.g.
 *   `"50-exercises/07_BENCH_PRESS"` or
 *   `"50-exercises/62_CORE/11_PALLOF_PRESS.md"` (`exercisePrescriptionRegistry.ts`).
 *
 * Both are legitimate — an engine document and an exercise chapter are
 * genuinely different kinds of source, and the existing engine-document
 * constants in `contracts.ts`/`prescriptionKnowledge.ts` are not renamed
 * here (no demonstrated need — see the final report). This file only
 * makes the two shapes explicit and checkable, so a future registry entry
 * cannot introduce a third, ad hoc shape.
 */

import type { Identifier } from "../types";

/** `<two digits>_<UPPER_SNAKE_CASE>_V0_1`, matching `31_TRAINING_METHOD_CATALOGUE_V0_1` etc. */
const ENGINE_DOCUMENT_SOURCE_ID_PATTERN = /^\d{2}_[A-Z0-9_]+_V\d+_\d+$/;

/** A `50-exercises/` path, with or without a `.md` extension (both schema generations coexist). */
const EXERCISE_CHAPTER_SOURCE_ID_PATTERN = /^50-exercises\/[A-Za-z0-9_'./-]+$/;

export type SourceRuleIdentifierKind = "engine_document" | "exercise_chapter";

export const isEngineDocumentSourceId = (value: string): boolean => ENGINE_DOCUMENT_SOURCE_ID_PATTERN.test(value);

export const isExerciseChapterSourceId = (value: string): boolean => EXERCISE_CHAPTER_SOURCE_ID_PATTERN.test(value);

export const classifySourceRuleIdentifier = (value: string): SourceRuleIdentifierKind | null => {
  if (isEngineDocumentSourceId(value)) {
    return "engine_document";
  }
  if (isExerciseChapterSourceId(value)) {
    return "exercise_chapter";
  }
  return null;
};

export const isValidSourceRuleId = (value: string): boolean => classifySourceRuleIdentifier(value) !== null;

/** Every id in `values` that matches neither known shape — empty when the list is fully valid. */
export const findNonConformingSourceRuleIds = (values: readonly Identifier[]): readonly Identifier[] =>
  values.filter((value) => value.trim().length === 0 || !isValidSourceRuleId(value));

/**
 * Combat Athlete System — Instruction Registry
 * Version 0.1
 *
 * A single factory for `InstructionDefinition` objects, used by
 * `exercisePrescriptionRegistry.ts` to turn each pilot exercise's own
 * documented "Coaching Cues" / "Equipment Requirements" / "Contraindications"
 * text into structured instructions. No instruction text in this file is
 * invented — every call site in `exercisePrescriptionRegistry.ts` cites the
 * exercise chapter and section it was taken from.
 */

import type { Identifier } from "../types";
import type { InstructionCategory, InstructionPriority } from "./types";
import type { InstructionDefinition } from "./resolveInstructions";

export function makeInstruction(
  instructionId: Identifier,
  category: InstructionCategory,
  text: string,
  priority: InstructionPriority,
  mandatory: boolean,
  sourceRuleId: Identifier,
): InstructionDefinition {
  return {
    instructionId,
    category,
    text,
    priority,
    mandatory,
    sourceRuleId,
  };
}

/**
 * Combat Athlete System — Prescription Public API
 * Version 0.1
 *
 * Single public entry point for the deterministic prescription layer.
 */

// Canonical contracts and shared types
export * from "./types";
export * from "./contracts";
export * from "./prescriptionKnowledge";

// Resolution stages
export * from "./resolveMethod";
export * from "./validateCompatibility";
export * from "./resolveVolume";
export * from "./resolveIntensity";
export * from "./resolveRest";
export * from "./resolveTempo";
export * from "./resolveInstructions";
export * from "./resolveStopConditions";

// Final validation and orchestration
export * from "./validatePrescription";
export * from "./prescribeExercise";
export * from "./prescribeSession";

// Decision Trace adapter
export * from "./prescriptionDecisionTrace";

// Engine integration (session draft → prescription input, and orchestration)
export * from "./buildPrescriptionInput";
export * from "./prescribeEngineSession";

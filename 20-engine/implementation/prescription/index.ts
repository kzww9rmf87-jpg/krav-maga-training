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

// Canonical registry vocabularies (equipment, athlete references, duration
// profiles, source-rule identifier convention) and cross-entry validators
export * from "./equipmentCapabilities";
export * from "./deriveEquipmentCapabilities";
export * from "./deriveRangeContext";
export * from "./deriveAthleteReferences";
export * from "./athleteReferenceCatalog";
export * from "./durationEstimationProfiles";
export * from "./durationEstimationModel";
export * from "./estimatePrescriptionDuration";
export * from "./sourceRuleIdentifiers";

// Pilot exercise prescription registry (vertical slice)
export * from "./instructionRegistry";
export * from "./stopConditionRegistry";
export * from "./exercisePrescriptionRegistry";
export * from "./buildEngineSessionPrescriptionSources";
export * from "./registryValidators";

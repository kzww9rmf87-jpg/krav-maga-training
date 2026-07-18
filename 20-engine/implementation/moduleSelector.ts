/**
 * Combat Athlete System — Capability Module Selection
 * Version 0.1
 *
 * Translates validated objectives into a deterministic, ordered selection
 * of canonical Capability Modules. Runs after `validateEngineInput` and
 * before any exercise retrieval, eligibility filtering or scoring.
 *
 * The mapping from `AdaptationDomain` to `CapabilityModule` used here is
 * intentionally minimal (one adaptation → at most one module) and never
 * adds a companion module automatically. `preparation`, `core`, `grip` and
 * any other support module only ever appear when explicitly requested via
 * `requestedModules` or `request.requiredModules` — see `01_MODULE_ENGINE.md`
 * ("A session is not expected to contain every Capability Module... a
 * module must not be selected only because... more variety is desired")
 * and the still-open question, flagged during audit, of whether a broader
 * per-adaptation module set is ever justified without inventing an
 * undocumented rule.
 *
 * Explicitly deferred to later modules (not implemented here):
 * - session duration;
 * - readiness and recovery capacity;
 * - equipment or real exercise availability;
 * - module-level scoring or fatigue cost;
 * - conflict detection between selected modules;
 * - automatic inclusion of `preparation` or any other support module;
 * - exercise selection of any kind;
 * - Decision Trace generation.
 */

import type {
  AdaptationDomain,
  CapabilityModule,
  EngineInput,
  ModuleSelectionResult,
  SelectedModule,
  SessionObjective,
} from "./types";

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Selects the canonical Capability Modules implied by `input.request`:
 * the primary objective, every secondary objective, and any explicitly
 * required module — minus anything explicitly excluded. The result always
 * follows the canonical physiological order (`MODULE_ORDER`), regardless
 * of the order modules appeared in the input.
 */
export function selectCapabilityModules(input: EngineInput): ModuleSelectionResult {
  const selection = new Map<CapabilityModule, SelectedModule>();

  const considerCandidate = (candidate: SelectedModule): void => {
    const existing = selection.get(candidate.module);
    if (existing === undefined || roleRank(candidate.role) > roleRank(existing.role)) {
      selection.set(candidate.module, candidate);
    }
  };

  for (const candidate of selectModulesForObjective(input.request.primaryObjective, "primary")) {
    considerCandidate(candidate);
  }

  for (const secondaryObjective of input.request.secondaryObjectives ?? []) {
    for (const candidate of selectModulesForObjective(secondaryObjective, "secondary")) {
      considerCandidate(candidate);
    }
  }

  for (const requiredModule of input.request.requiredModules ?? []) {
    considerCandidate({
      module: requiredModule,
      role: "support",
      primaryAdaptation: input.request.primaryObjective.adaptationDomain,
      reason: "Explicitly required by the training request.",
    });
  }

  for (const excludedModule of input.request.excludedModules ?? []) {
    selection.delete(excludedModule);
  }

  const selectedModules = [...selection.values()].sort(
    (a, b) => MODULE_ORDER.indexOf(a.module) - MODULE_ORDER.indexOf(b.module),
  );

  return { selectedModules };
}

/**
 * Produces the module candidates implied by a single objective: the module
 * directly associated with its `adaptationDomain` (if any — `specific_skill`
 * has none), followed by every module named in `requestedModules`. Both
 * kinds of candidate receive `role`, matching whether `objective` is the
 * primary or a secondary objective. Reused for the primary objective and
 * for each secondary objective in turn, which is what gives the final
 * selection its deterministic processing order.
 */
export function selectModulesForObjective(
  objective: SessionObjective,
  role: "primary" | "secondary",
): SelectedModule[] {
  const candidates: SelectedModule[] = [];

  const domainModule = MODULE_BY_ADAPTATION_DOMAIN[objective.adaptationDomain];
  if (domainModule !== undefined) {
    candidates.push({
      module: domainModule,
      role,
      primaryAdaptation: objective.adaptationDomain,
      reason:
        role === "primary"
          ? `Selected as the primary module for the ${objective.adaptationDomain} adaptation.`
          : `Selected as a secondary module for the ${objective.adaptationDomain} adaptation.`,
    });
  }

  for (const requestedModule of objective.requestedModules ?? []) {
    candidates.push({
      module: requestedModule,
      role,
      primaryAdaptation: objective.adaptationDomain,
      reason:
        role === "primary"
          ? "Explicitly requested by the primary objective."
          : "Explicitly requested by a secondary objective.",
    });
  }

  return candidates;
}

// -----------------------------------------------------------------------------
// Canonical mappings
// -----------------------------------------------------------------------------

/**
 * The minimal, documented one-to-one mapping from `AdaptationDomain` to its
 * directly associated Capability Module (`01_MODULE_ENGINE.md`, per-module
 * "Primary Adaptation" sections). `specific_skill` has no entry: it is not
 * a trainable Adaptation Domain of the physical-preparation engine, so it
 * never resolves to a module on its own.
 */
const MODULE_BY_ADAPTATION_DOMAIN: Readonly<Record<AdaptationDomain, CapabilityModule | undefined>> = {
  maximum_strength: "strength",
  power: "power",
  functional_hypertrophy: "functional_hypertrophy",
  conditioning: "conditioning",
  robustness: "robustness",
  movement: "movement",
  recovery: "recovery",
  specific_skill: undefined,
};

/** Canonical physiological order — `01_MODULE_ENGINE.md`, "Session Assembly." */
const MODULE_ORDER: readonly CapabilityModule[] = [
  "preparation",
  "movement",
  "power",
  "strength",
  "functional_hypertrophy",
  "robustness",
  "grip",
  "core",
  "conditioning",
  "recovery",
];

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** `primary` outranks `secondary`, which outranks `support`. */
function roleRank(role: SelectedModule["role"]): number {
  switch (role) {
    case "primary":
      return 3;
    case "secondary":
      return 2;
    case "support":
      return 1;
  }
}

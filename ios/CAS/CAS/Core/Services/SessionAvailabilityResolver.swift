import Foundation

/// Pure equipment-feasibility resolution — no SwiftUI, no persistence, no
/// generation. Decides, per exercise then per session, whether
/// `availableEquipment` (never `TrainingEnvironment`, which is context/
/// prefill only) makes a `TrainingSession` usable as authored, usable with
/// a documented substitution, or not usable at all.
///
/// Fails closed throughout: an exercise with no entry in `requirements` is
/// never assumed to need nothing, a `SessionFormat` this resolver doesn't
/// know how to walk (`.circuit`) is never silently skipped, and a missing
/// substitution is never a reason to keep the original prescription
/// anyway.
enum SessionAvailabilityResolver {

    /// Resolves a single exercise against `availableEquipment`.
    static func resolve(
        exercise: Exercise,
        availableEquipment: Set<Equipment>,
        requirements: [String: EquipmentRequirement] = ExerciseEquipmentRequirements.byExerciseId,
        substitutions: [String: ExerciseSubstitution] = [:]
    ) -> ExerciseResolution {
        guard let requirement = requirements[exercise.id] else {
            return .unavailable(reason: "Exigence matérielle non documentée pour \(exercise.name).")
        }
        if isSatisfied(requirement, by: availableEquipment) {
            return .original(exercise)
        }
        guard let substitution = substitutions[exercise.id] else {
            return .unavailable(reason: "\(exercise.name) nécessite un équipement non disponible, sans alternative fiable.")
        }
        return .substituted(
            original: exercise,
            replacement: substitution.replacement,
            equivalence: substitution.equivalence,
            note: substitution.prescription.note
        )
    }

    /// Resolves every exercise in `session` and aggregates the result.
    /// Only `.standard` sessions are supported — every CAS V0.1 session
    /// uses this format today; `.circuit` is refused explicitly rather
    /// than walked incorrectly or ignored.
    static func evaluate(
        _ session: TrainingSession,
        availableEquipment: Set<Equipment>,
        requirements: [String: EquipmentRequirement] = ExerciseEquipmentRequirements.byExerciseId,
        substitutions: [String: ExerciseSubstitution] = [:]
    ) -> SessionAvailability {
        guard case .standard(let modules) = session.format else {
            return .unavailable(reasons: ["Format de séance non pris en charge par le résolveur (circuit)."])
        }

        var unavailableReasons: [String] = []
        var appliedSubstitutions: [AppliedSubstitution] = []
        var hasPartialSubstitution = false

        let resolvedModules: [SessionModule] = modules.map { module in
            let resolvedExercises: [SessionExercise] = module.exercises.map { sessionExercise in
                let resolution = resolve(
                    exercise: sessionExercise.exercise,
                    availableEquipment: availableEquipment,
                    requirements: requirements,
                    substitutions: substitutions
                )
                switch resolution {
                case .original:
                    return sessionExercise

                case .substituted(let original, let replacement, let equivalence, let note):
                    appliedSubstitutions.append(AppliedSubstitution(
                        originalExerciseID: original.id,
                        replacementExerciseID: replacement.id,
                        equivalence: equivalence,
                        note: note
                    ))
                    if equivalence == .partial {
                        hasPartialSubstitution = true
                    }
                    // `resolve()` only returns `.substituted` after finding
                    // this exact entry, so the lookup below always
                    // succeeds — `resolve()`'s own `ExerciseResolution`
                    // doesn't carry the full prescription (groups, rest,
                    // free text), only equivalence and note, so it's
                    // fetched again here rather than force-unwrapped.
                    guard let substitution = substitutions[original.id] else {
                        return sessionExercise
                    }
                    return SessionExercise(
                        exercise: replacement,
                        restGuidance: substitution.prescription.restGuidance,
                        groups: substitution.prescription.groups,
                        note: substitution.prescription.note,
                        freeText: substitution.prescription.freeText
                    )

                case .unavailable(let reason):
                    unavailableReasons.append(reason)
                    return sessionExercise
                }
            }
            return SessionModule(id: module.id, module: module.module, exercises: resolvedExercises)
        }

        guard unavailableReasons.isEmpty else {
            return .unavailable(reasons: unavailableReasons)
        }

        let resolvedSession = TrainingSession(
            id: session.id,
            title: session.title,
            subtitle: session.subtitle,
            format: .standard(modules: resolvedModules),
            primaryActionCapability: session.primaryActionCapability
        )
        let resolved = ResolvedTrainingSession(session: resolvedSession, substitutions: appliedSubstitutions)

        return hasPartialSubstitution ? .availableWithCompromises(resolved) : .available(resolved)
    }

    private static func isSatisfied(_ requirement: EquipmentRequirement, by available: Set<Equipment>) -> Bool {
        requirement.isEmpty || requirement.contains { available.isSuperset(of: $0) }
    }
}

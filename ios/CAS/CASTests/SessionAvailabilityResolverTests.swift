import Foundation
import Testing
@testable import CAS

struct SessionAvailabilityResolverTests {

    // MARK: - resolve(exercise:)

    @Test func satisfiedRequirementResolvesToOriginal() {
        let exercise = Exercise(id: "cas-force-fentes", name: "Fentes", primaryAdaptation: .functionalHypertrophy)
        let resolution = SessionAvailabilityResolver.resolve(exercise: exercise, availableEquipment: [])
        #expect(resolution == .original(exercise))
    }

    @Test func equipmentAlternativesAreEvaluatedCorrectly() {
        // "cas-force-rowing" requires [[.barbell], [.cableMachine]] — either alone suffices.
        let exercise = Exercise(id: "cas-force-rowing", name: "Rowing horizontal", primaryAdaptation: .maximumStrength)

        let withBarbellOnly = SessionAvailabilityResolver.resolve(exercise: exercise, availableEquipment: [.barbell])
        #expect(withBarbellOnly == .original(exercise))

        let withCableOnly = SessionAvailabilityResolver.resolve(exercise: exercise, availableEquipment: [.cableMachine])
        #expect(withCableOnly == .original(exercise))

        let withNeither = SessionAvailabilityResolver.resolve(exercise: exercise, availableEquipment: [.dumbbells])
        guard case .unavailable = withNeither else {
            Issue.record("Expected .unavailable when neither alternative is present")
            return
        }
    }

    @Test func undocumentedExerciseIdFailsClosedRatherThanAssumingNoEquipmentIsNeeded() {
        let exercise = Exercise(id: "not-in-the-table", name: "Exercice fantôme", primaryAdaptation: .movement)
        let resolution = SessionAvailabilityResolver.resolve(exercise: exercise, availableEquipment: [.barbell, .dumbbells, .kettlebell])

        guard case .unavailable(let reason) = resolution else {
            Issue.record("Expected .unavailable for an undocumented exerciseId, even with equipment available")
            return
        }
        #expect(reason.contains("non documentée"))
    }

    @Test func partialSubstitutionReplacesThePrescriptionEntirely() {
        let exercise = Exercise(id: "cas-puissance-lancers-medecine-ball", name: "Lancers medicine ball", primaryAdaptation: .power)
        let resolution = SessionAvailabilityResolver.resolve(
            exercise: exercise,
            availableEquipment: [],
            substitutions: CASPuissanceSubstitutions.byExerciseId
        )

        guard case .substituted(let original, let replacement, let equivalence, let note) = resolution else {
            Issue.record("Expected .substituted")
            return
        }
        #expect(original == exercise)
        #expect(replacement.name == "Pompes pliométriques")
        #expect(equivalence == .partial)
        #expect(note.contains("décollage"))
    }

    @Test func noAvailableSubstitutionResolvesToUnavailable() {
        // No substitution table passed — even an exercise with a known
        // documented substitution elsewhere must not silently receive it.
        let exercise = Exercise(id: "cas-puissance-lancers-medecine-ball", name: "Lancers medicine ball", primaryAdaptation: .power)
        let resolution = SessionAvailabilityResolver.resolve(exercise: exercise, availableEquipment: [])

        guard case .unavailable = resolution else {
            Issue.record("Expected .unavailable with no substitution table supplied")
            return
        }
    }

    // MARK: - Suspension lestée — externalLoad

    @Test func suspensionLesteeIsUnavailableWithoutExternalLoad() {
        let exercise = Exercise(id: "cas-robustesse-suspension-lestee", name: "Suspension lestée", primaryAdaptation: .robustness)
        let resolution = SessionAvailabilityResolver.resolve(exercise: exercise, availableEquipment: [.pullUpBar])

        guard case .unavailable = resolution else {
            Issue.record("A pull-up bar alone must not satisfy suspension lestée")
            return
        }
    }

    @Test func suspensionLesteeIsAvailableWithPullUpBarAndExternalLoad() {
        let exercise = Exercise(id: "cas-robustesse-suspension-lestee", name: "Suspension lestée", primaryAdaptation: .robustness)
        let resolution = SessionAvailabilityResolver.resolve(exercise: exercise, availableEquipment: [.pullUpBar, .externalLoad])
        #expect(resolution == .original(exercise))
    }

    // MARK: - evaluate(_:) — whole-session aggregation

    @Test func aSingleUnavailableExerciseMakesTheWholeSessionUnavailable() {
        let availability = SessionAvailabilityResolver.evaluate(CASHypertrophie.session, availableEquipment: [])

        guard case .unavailable(let reasons) = availability else {
            Issue.record("Expected the whole session unavailable — tractions/élévations/superset have no bodyweight fallback")
            return
        }
        #expect(!reasons.isEmpty)
    }

    @Test func circuitFormatIsUnavailableRatherThanIgnored() {
        let circuitSession = TrainingSession(
            id: "test-circuit",
            title: "Circuit",
            subtitle: "",
            format: .circuit(
                module: CapabilityModuleCatalog.conditioning,
                spec: CircuitSpec(exercises: [], rounds: 3, restBetweenRounds: "30 sec", note: nil)
            )
        )

        let availability = SessionAvailabilityResolver.evaluate(circuitSession, availableEquipment: [.barbell, .dumbbells])

        guard case .unavailable(let reasons) = availability else {
            Issue.record("Expected .unavailable for a circuit-format session")
            return
        }
        #expect(reasons.contains { $0.contains("circuit") })
    }

    @Test func aStrongSubstitutionIsTracedButDoesNotTriggerCompromiseStatus() {
        let session = TrainingSession(
            id: "test-strong",
            title: "Test",
            subtitle: "",
            format: .standard(modules: [
                SessionModule(module: CapabilityModuleCatalog.strength, exercises: [
                    SessionExercise(
                        exercise: Exercise(id: "needs-cable", name: "Original", primaryAdaptation: .maximumStrength),
                        note: "Note"
                    ),
                ]),
            ])
        )
        let requirements: [String: EquipmentRequirement] = ["needs-cable": [[.cableMachine]]]
        let substitutions: [String: ExerciseSubstitution] = [
            "needs-cable": ExerciseSubstitution(
                replacement: Exercise(id: "strong-replacement", name: "Remplacement", primaryAdaptation: .maximumStrength),
                equivalence: .strong,
                prescription: SubstitutePrescription(groups: [], note: "Équivalence forte, rien à signaler.")
            ),
        ]

        let availability = SessionAvailabilityResolver.evaluate(
            session, availableEquipment: [], requirements: requirements, substitutions: substitutions
        )

        guard case .available(let resolved) = availability else {
            Issue.record("A strong substitution must resolve to .available, not .availableWithCompromises")
            return
        }
        #expect(resolved.substitutions.count == 1)
        #expect(resolved.substitutions[0].originalExerciseID == "needs-cable")
        #expect(resolved.substitutions[0].replacementExerciseID == "strong-replacement")
        #expect(resolved.substitutions[0].equivalence == .strong)
    }

    @Test func partialSubstitutionsProduceAvailableWithCompromises() {
        let availability = SessionAvailabilityResolver.evaluate(
            CASPuissance.session,
            availableEquipment: [],
            substitutions: CASPuissanceSubstitutions.byExerciseId
        )

        guard case .availableWithCompromises(let resolved) = availability else {
            Issue.record("Expected .availableWithCompromises with no equipment and the CAS Puissance substitution table")
            return
        }
        let partialCount = resolved.substitutions.filter { $0.equivalence == .partial }.count
        #expect(partialCount == 3) // épaulé-jeté, lancers, rotation du tronc
    }

    @Test func orderModulesAndUnsubstitutedExercisesArePreserved() {
        // Full gym equipment: nothing needs substituting, structure must
        // come back untouched.
        let fullEquipment: Set<Equipment> = [.barbell, .dumbbells, .kettlebell, .cableMachine, .medicineBall]
        let availability = SessionAvailabilityResolver.evaluate(CASPuissance.session, availableEquipment: fullEquipment)

        guard case .available(let resolved) = availability else {
            Issue.record("Expected .available with full equipment")
            return
        }
        #expect(resolved.substitutions.isEmpty)
        #expect(resolved.session.moduleNames == CASPuissance.session.moduleNames)

        guard case .standard(let resolvedModules) = resolved.session.format,
              case .standard(let originalModules) = CASPuissance.session.format else {
            Issue.record("Expected .standard format")
            return
        }
        let resolvedExerciseNames = resolvedModules.flatMap { $0.exercises.map(\.exercise.name) }
        let originalExerciseNames = originalModules.flatMap { $0.exercises.map(\.exercise.name) }
        #expect(resolvedExerciseNames == originalExerciseNames)
    }
}

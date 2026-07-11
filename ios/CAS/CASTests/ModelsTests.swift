import Foundation
import Testing
@testable import CAS

struct ModelsTests {

    @Test func exerciseHasExactlyOnePrimaryAdaptation() {
        let exercise = Exercise(
            id: "bench-press-close-grip",
            name: "Développé-couché mains serrées",
            primaryAdaptation: .maximumStrength,
            secondaryAdaptations: [.power]
        )
        #expect(exercise.primaryAdaptation == .maximumStrength)
        #expect(!exercise.secondaryAdaptations.contains(.maximumStrength))
    }

    @Test func exerciseRoundTripsThroughJSON() throws {
        let original = Exercise(
            id: "back-squat",
            name: "Squats partiels",
            primaryAdaptation: .maximumStrength,
            coachNote: "Amplitude partielle dans la zone de force maximale."
        )
        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(Exercise.self, from: data)
        #expect(decoded == original)
    }

    @Test func standardSessionAggregatesModulesAndExercisesInOrder() {
        let exerciseA = Exercise(id: "a", name: "A", primaryAdaptation: .movement)
        let exerciseB = Exercise(id: "b", name: "B", primaryAdaptation: .power)
        let session = TrainingSession(
            id: "seance-a",
            title: "Séance A — Force maximale",
            subtitle: "Demi-pyramide montante",
            format: .standard(modules: [
                SessionModule(
                    module: CapabilityModuleCatalog.movement,
                    exercises: [
                        SessionExercise(
                            exercise: exerciseA,
                            groups: [SetGroup(kind: .work, sets: [SetSpec(load: .weighted(value: 80, unit: .kg), reps: "5")])],
                            note: "Note A"
                        ),
                    ]
                ),
                SessionModule(
                    module: CapabilityModuleCatalog.power,
                    exercises: [
                        SessionExercise(
                            exercise: exerciseB,
                            groups: [SetGroup(kind: .work, sets: [SetSpec(load: .weighted(value: 40, unit: .kg), reps: "6")])],
                            note: "Note B"
                        ),
                    ]
                ),
            ])
        )
        #expect(session.steps.map(\.exerciseName) == ["A", "B"])
    }

    @Test func standardStepsCarryRestParsedFromExerciseGuidance() {
        let exercise = Exercise(id: "a", name: "A", primaryAdaptation: .maximumStrength)
        let sessionExercise = SessionExercise(
            exercise: exercise,
            restGuidance: "3-4 min entre séries lourdes",
            groups: [SetGroup(kind: .work, sets: [SetSpec(load: .weighted(value: 80, unit: .kg), reps: "5")])],
            note: "Note"
        )
        let steps = sessionExercise.makeSteps()
        #expect(steps.count == 1)
        #expect(steps[0].restAfter?.seconds == 240)
    }

    @Test func unparseableRestGuidanceYieldsNoTimerButKeepsLabel() {
        let exercise = Exercise(id: "finition", name: "Finition", primaryAdaptation: .conditioning)
        let sessionExercise = SessionExercise(
            exercise: exercise,
            restGuidance: "Aucun — enchaîné",
            note: "Fatigue technique",
            freeText: "5 min de sac de frappe"
        )
        let steps = sessionExercise.makeSteps()
        #expect(steps.count == 1)
        #expect(steps[0].instruction == .freeText("5 min de sac de frappe"))
        #expect(steps[0].restAfter?.seconds == nil)
        #expect(steps[0].restAfter?.label == "Aucun — enchaîné")
    }

    @Test func circuitStepsRestOnlyBetweenRoundsNeverAfterTheLastOne() {
        let spec = CircuitSpec(
            exercises: [
                CircuitExercise(name: "Coups de poing poulie", detail: "Vitesse max"),
                CircuitExercise(name: "Squats partiels", detail: "60kg"),
            ],
            rounds: 3,
            restBetweenRounds: "30 sec entre circuits",
            note: "Ne jamais enchaîner avant une séance A ou B."
        )
        let steps = spec.makeSteps()

        // 2 exercises x 3 rounds = 6 steps.
        #expect(steps.count == 6)

        // No rest between exercises within a round (chained).
        #expect(steps[0].restAfter == nil)
        // Rest after the last exercise of round 1 and round 2...
        #expect(steps[1].restAfter?.seconds == 30)
        #expect(steps[3].restAfter?.seconds == 30)
        // ...but never after the last exercise of the final round.
        #expect(steps[5].restAfter == nil)

        #expect(steps[0].label == "Tour 1/3")
        #expect(steps[4].label == "Tour 3/3")
    }

    @Test func sessionFormatsAreInterchangeableThroughSteps() {
        // The point of SessionFormat: the execution engine only ever needs
        // `[ExecutionStep]`, regardless of which format produced them.
        let standard = TrainingSession(
            id: "standard",
            title: "Standard",
            subtitle: "",
            format: .standard(modules: [
                SessionModule(
                    module: CapabilityModuleCatalog.strength,
                    exercises: [
                        SessionExercise(
                            exercise: Exercise(id: "a", name: "A", primaryAdaptation: .maximumStrength),
                            groups: [SetGroup(kind: .work, sets: [SetSpec(load: .weighted(value: 80, unit: .kg), reps: "5")])],
                            note: ""
                        ),
                    ]
                ),
            ])
        )
        let circuit = TrainingSession(
            id: "circuit",
            title: "Circuit",
            subtitle: "",
            format: .circuit(
                module: CapabilityModuleCatalog.conditioning,
                spec: CircuitSpec(
                    exercises: [CircuitExercise(name: "B", detail: "Vitesse max")],
                    rounds: 1,
                    restBetweenRounds: nil,
                    note: nil
                )
            )
        )
        for session in [standard, circuit] {
            #expect(!session.steps.isEmpty)
        }
    }

    @Test func setGroupPreservesRangesAndRelativeLoadsAsCustomText() {
        // Ranges ("88-90kg") and relative labels ("+2kg") don't collapse
        // into a single number — they stay `.custom`, never reinterpreted.
        let group = SetGroup(
            kind: .work,
            sets: [
                SetSpec(load: .custom("88-90kg"), reps: "2-3"),
                SetSpec(load: .custom("+2kg"), reps: "5"),
            ]
        )
        #expect(group.kind == .work)
        #expect(group.sets.map(\.load) == [.custom("88-90kg"), .custom("+2kg")])
    }

    @Test func restAfterParsesRangesAndUnits() {
        #expect(RestAfter.parse("90 sec").seconds == 90)
        #expect(RestAfter.parse("60-90 sec").seconds == 90)
        #expect(RestAfter.parse("2-3 min").seconds == 180)
        #expect(RestAfter.parse("45 sec entre super-sets").seconds == 45)
        #expect(RestAfter.parse("Aucun — enchaîné").seconds == nil)
    }

    @Test func adaptationDomainHasAFrenchDisplayName() {
        #expect(AdaptationDomain.maximumStrength.displayName == "Force maximale")
        #expect(AdaptationDomain.specificSkill.displayName == "Compétence spécifique")
    }

    @Test func estimatedDurationSumsRestPlusAFlatPerStepAssumptionRoundedToFiveMinutes() {
        // Two steps, 90s rest each after the first (not the last, so it
        // doesn't count): 90 rest + 2*30 execution = 150s = 2.5min,
        // rounded to the nearest 5 -> 5 (the floor from `max(5, ...)`).
        let session = TrainingSession(
            id: "duration-test",
            title: "Duration test",
            subtitle: "",
            format: .standard(modules: [
                SessionModule(
                    module: CapabilityModuleCatalog.strength,
                    exercises: [
                        SessionExercise(
                            exercise: Exercise(id: "a", name: "A", primaryAdaptation: .maximumStrength),
                            restGuidance: "90 sec",
                            groups: [SetGroup(kind: .work, sets: [
                                SetSpec(load: .weighted(value: 80, unit: .kg), reps: "5"),
                                SetSpec(load: .weighted(value: 80, unit: .kg), reps: "5"),
                            ])],
                            note: ""
                        ),
                    ]
                ),
            ])
        )
        #expect(session.estimatedDurationMinutes == 5)
    }

    @Test func estimatedDurationIsNeverBelowFiveMinutes() {
        let session = TrainingSession(
            id: "tiny",
            title: "Tiny",
            subtitle: "",
            format: .standard(modules: [])
        )
        #expect(session.estimatedDurationMinutes == 5)
    }

    @Test func repCountParsesSingleValuesAndUpperBoundsOfRanges() {
        #expect(RepCount.parse("8") == 8)
        #expect(RepCount.parse("8-10") == 10)
        #expect(RepCount.parse("10 vitesse max") == 10)
        #expect(RepCount.parse("Tenue max") == nil)
        #expect(RepCount.parse("Max reps") == nil)
    }

    @Test func exerciseOverviewsCountDistinctExercisesAndTheirSets() {
        let session = TrainingSession(
            id: "overview-test",
            title: "Overview test",
            subtitle: "",
            format: .standard(modules: [
                SessionModule(
                    module: CapabilityModuleCatalog.strength,
                    exercises: [
                        SessionExercise(
                            exercise: Exercise(id: "a", name: "A", primaryAdaptation: .maximumStrength),
                            groups: [SetGroup(kind: .work, sets: [
                                SetSpec(load: .weighted(value: 80, unit: .kg), reps: "5"),
                                SetSpec(load: .weighted(value: 80, unit: .kg), reps: "5"),
                            ])],
                            note: ""
                        ),
                        SessionExercise(
                            exercise: Exercise(id: "b", name: "B", primaryAdaptation: .maximumStrength),
                            groups: [SetGroup(kind: .work, sets: [SetSpec(load: .bodyweight, reps: "10")])],
                            note: ""
                        ),
                    ]
                ),
            ])
        )
        #expect(session.exerciseCount == 2)
        #expect(session.setCount == 3)
        #expect(session.exerciseOverviews == [
            ExerciseOverview(exerciseName: "A", setCount: 2),
            ExerciseOverview(exerciseName: "B", setCount: 1),
        ])
    }

    @Test func estimatedVolumeOnlyCountsWeightedLoadsWithParseableReps() {
        let session = TrainingSession(
            id: "volume-test",
            title: "Volume test",
            subtitle: "",
            format: .standard(modules: [
                SessionModule(
                    module: CapabilityModuleCatalog.strength,
                    exercises: [
                        SessionExercise(
                            exercise: Exercise(id: "a", name: "A", primaryAdaptation: .maximumStrength),
                            groups: [SetGroup(kind: .work, sets: [
                                SetSpec(load: .weighted(value: 100, unit: .kg), reps: "5"),
                            ])],
                            note: ""
                        ),
                    ]
                ),
            ])
        )
        #expect(session.estimatedVolumeKg == 500)
    }

    @Test func estimatedVolumeIsNilWhenNothingIsNumeric() {
        // Every CAS V0.1 session today — qualitative loads by design.
        let session = TrainingSession(
            id: "qualitative-only",
            title: "Qualitative only",
            subtitle: "",
            format: .standard(modules: [
                SessionModule(
                    module: CapabilityModuleCatalog.strength,
                    exercises: [
                        SessionExercise(
                            exercise: Exercise(id: "a", name: "A", primaryAdaptation: .maximumStrength),
                            groups: [SetGroup(kind: .work, sets: [SetSpec(load: .qualitative(.heavy), reps: "5")])],
                            note: ""
                        ),
                    ]
                ),
            ])
        )
        #expect(session.estimatedVolumeKg == nil)
    }
}

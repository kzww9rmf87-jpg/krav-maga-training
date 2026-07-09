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

    @Test func sessionAggregatesExercisesInOrder() {
        let exerciseA = Exercise(id: "a", name: "A", primaryAdaptation: .movement)
        let exerciseB = Exercise(id: "b", name: "B", primaryAdaptation: .power)
        let session = TrainingSession(
            id: "seance-a",
            title: "Séance A — Force maximale",
            subtitle: "Demi-pyramide montante",
            exercises: [
                SessionExercise(exercise: exerciseA, note: "Note A"),
                SessionExercise(exercise: exerciseB, note: "Note B"),
            ]
        )
        #expect(session.exercises.map(\.exercise.id) == ["a", "b"])
    }

    @Test func setGroupPreservesLoadAndRepsAsFreeText() {
        let group = SetGroup(
            kind: .work,
            sets: [
                SetSpec(load: "88-90kg", reps: "2-3"),
                SetSpec(load: "+2kg", reps: "5"),
            ]
        )
        #expect(group.kind == .work)
        #expect(group.sets.map(\.load) == ["88-90kg", "+2kg"])
    }

    @Test func adaptationDomainHasAFrenchDisplayName() {
        #expect(AdaptationDomain.maximumStrength.displayName == "Force maximale")
        #expect(AdaptationDomain.specificSkill.displayName == "Compétence spécifique")
    }
}

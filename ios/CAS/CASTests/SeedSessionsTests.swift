import Testing
@testable import CAS

struct SeedSessionsTests {

    @Test func allFiveRealSessionsArePresent() {
        let ids = SeedSessions.all.map(\.id)
        #expect(ids == ["seance-a", "seance-b", "seance-c", "seance-d", "bras"])
    }

    @Test func sessionIdsAreUnique() {
        let ids = SeedSessions.all.map(\.id)
        #expect(Set(ids).count == ids.count)
    }

    @Test func everySessionProducesAtLeastOneExecutionStep() {
        for session in SeedSessions.all {
            #expect(!session.steps.isEmpty, "\(session.title) has no steps")
        }
    }

    @Test func seanceCUsesTheCircuitFormatWithWeekOneParameters() {
        guard case .circuit(let spec) = SeanceC.session.format else {
            Issue.record("Séance C should use the circuit format")
            return
        }
        #expect(spec.rounds == 3)
        #expect(spec.exercises.count == 6)
        // 6 exercises x 3 rounds.
        #expect(SeanceC.session.steps.count == 18)
    }

    @Test func sharedExercisesKeepTheSameIdentityAcrossSessions() {
        guard
            case .standard(let bExercises) = SeanceB.session.format,
            case .standard(let dExercises) = SeanceD.session.format
        else {
            Issue.record("Séances B and D should use the standard format")
            return
        }
        let kneeStrikeInB = bExercises.first { $0.exercise.id == "coup-de-genou-4-pattes" }
        let kneeStrikeInD = dExercises.first { $0.exercise.id == "coup-de-genou-4-pattes" }
        #expect(kneeStrikeInB?.exercise == kneeStrikeInD?.exercise)
    }
}

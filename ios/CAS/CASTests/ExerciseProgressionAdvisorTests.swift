import Testing
@testable import CAS

struct ExerciseProgressionAdvisorTests {

    private func workSet(planned: LoadValue, plannedReps: String, actual: LoadValue? = nil, actualReps: String? = nil) -> SetLog {
        SetLog(
            exerciseName: "Test",
            groupKind: .work,
            plannedLoad: planned,
            plannedReps: plannedReps,
            actualLoad: actual,
            actualReps: actualReps
        )
    }

    @Test func proposesTheConfiguredIncrementWhenAllNumericSetsMeetTarget() {
        let sets = [
            workSet(planned: .weighted(value: 60, unit: .kg), plannedReps: "8", actual: .weighted(value: 60, unit: .kg), actualReps: "8"),
            workSet(planned: .weighted(value: 60, unit: .kg), plannedReps: "8", actual: .weighted(value: 60, unit: .kg), actualReps: "8"),
        ]
        #expect(ExerciseProgressionAdvisor.suggestion(for: sets) == .increase(.weighted(value: 62.5, unit: .kg)))
    }

    @Test func exceedingTheTargetStillCountsAsMet() {
        let sets = [
            workSet(planned: .weighted(value: 60, unit: .kg), plannedReps: "8", actual: .weighted(value: 60, unit: .kg), actualReps: "10"),
        ]
        #expect(ExerciseProgressionAdvisor.suggestion(for: sets) == .increase(.weighted(value: 62.5, unit: .kg)))
    }

    @Test func holdsTheSameLoadWhenTargetRepsWerentAllMet() {
        let sets = [
            workSet(planned: .weighted(value: 60, unit: .kg), plannedReps: "8", actual: .weighted(value: 60, unit: .kg), actualReps: "8"),
            workSet(planned: .weighted(value: 60, unit: .kg), plannedReps: "8", actual: .weighted(value: 60, unit: .kg), actualReps: "6"),
        ]
        #expect(ExerciseProgressionAdvisor.suggestion(for: sets) == .hold(.weighted(value: 60, unit: .kg)))
    }

    @Test func qualitativeLoadsAlwaysHoldRegardlessOfPerformance() {
        let sets = [
            workSet(planned: .qualitative(.heavy), plannedReps: "8", actual: .qualitative(.heavy), actualReps: "8"),
        ]
        #expect(ExerciseProgressionAdvisor.suggestion(for: sets) == .hold(.qualitative(.heavy)))
    }

    @Test func mixedQualitativeAndNumericSetsAreUnavailable() {
        let sets = [
            workSet(planned: .weighted(value: 60, unit: .kg), plannedReps: "8", actual: .weighted(value: 60, unit: .kg), actualReps: "8"),
            workSet(planned: .qualitative(.heavy), plannedReps: "8", actual: .qualitative(.heavy), actualReps: "8"),
        ]
        #expect(ExerciseProgressionAdvisor.suggestion(for: sets) == .unavailable)
    }

    @Test func customTextLoadsAreUnavailable() {
        let sets = [workSet(planned: .custom("Base"), plannedReps: "6", actual: .custom("Base"), actualReps: "6")]
        #expect(ExerciseProgressionAdvisor.suggestion(for: sets) == .unavailable)
    }

    @Test func noWorkSetsAreUnavailable() {
        let warmupOnly = [
            SetLog(exerciseName: "Test", groupKind: .warmup, plannedLoad: .weighted(value: 40, unit: .kg), plannedReps: "10"),
        ]
        #expect(ExerciseProgressionAdvisor.suggestion(for: warmupOnly) == .unavailable)
    }

    @Test func warmupSetsAreExcludedFromTheDecision() {
        let sets = [
            SetLog(exerciseName: "Test", groupKind: .warmup, plannedLoad: .weighted(value: 20, unit: .kg), plannedReps: "10", actualLoad: .weighted(value: 20, unit: .kg), actualReps: "3"),
            workSet(planned: .weighted(value: 60, unit: .kg), plannedReps: "8", actual: .weighted(value: 60, unit: .kg), actualReps: "8"),
        ]
        // The warm-up set's poor rep count must not block the suggestion.
        #expect(ExerciseProgressionAdvisor.suggestion(for: sets) == .increase(.weighted(value: 62.5, unit: .kg)))
    }

    @Test func unparseableRepsHoldRatherThanPropose() {
        let sets = [workSet(planned: .weighted(value: 20, unit: .kg), plannedReps: "Tenue max", actual: .weighted(value: 20, unit: .kg), actualReps: "Tenue max")]
        #expect(ExerciseProgressionAdvisor.suggestion(for: sets) == .hold(.weighted(value: 20, unit: .kg)))
    }

    @Test func lessAssistanceIsTheProgressionDirectionForAssistedMovements() {
        let sets = [workSet(planned: .bodyweightAssisted(value: 20, unit: .kg), plannedReps: "8", actual: .bodyweightAssisted(value: 20, unit: .kg), actualReps: "8")]
        #expect(ExerciseProgressionAdvisor.suggestion(for: sets) == .increase(.bodyweightAssisted(value: 17.5, unit: .kg)))
    }

    @Test func lbUnitUsesTheLbIncrement() {
        let sets = [workSet(planned: .weighted(value: 135, unit: .lb), plannedReps: "5", actual: .weighted(value: 135, unit: .lb), actualReps: "5")]
        #expect(ExerciseProgressionAdvisor.suggestion(for: sets) == .increase(.weighted(value: 140, unit: .lb)))
    }
}

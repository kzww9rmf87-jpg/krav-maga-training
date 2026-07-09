import Testing
@testable import CAS

@MainActor
struct SessionExecutionViewModelTests {

    private func makeSession() -> TrainingSession {
        let exercise = Exercise(id: "a", name: "A", primaryAdaptation: .maximumStrength)
        return TrainingSession(
            id: "test",
            title: "Test",
            subtitle: "",
            format: .standard(exercises: [
                SessionExercise(
                    exercise: exercise,
                    restGuidance: "90 sec",
                    groups: [SetGroup(kind: .work, sets: [
                        SetSpec(load: "80kg", reps: "5"),
                        SetSpec(load: "85kg", reps: "4"),
                    ])],
                    note: "Note"
                ),
            ])
        )
    }

    @Test func advancingThroughASetWithRestShowsTheRestScreen() {
        let viewModel = SessionExecutionViewModel(session: makeSession())
        #expect(viewModel.currentIndex == 0)
        #expect(viewModel.isLastStep == false)

        viewModel.advance()

        #expect(viewModel.isResting == true)
        #expect(viewModel.restTimer.remainingSeconds == 90)
        #expect(viewModel.setLogs[0]?.completed == true)
        // Still on step 0 — the index only moves once rest is dismissed.
        #expect(viewModel.currentIndex == 0)
    }

    @Test func finishingRestMovesToTheNextStep() {
        let viewModel = SessionExecutionViewModel(session: makeSession())
        viewModel.advance()
        viewModel.finishResting()
        #expect(viewModel.currentIndex == 1)
        #expect(viewModel.isResting == false)
        #expect(viewModel.isLastStep == true)
    }

    @Test func advancingOnTheLastStepCallsOnFinishWithAllLogs() {
        let viewModel = SessionExecutionViewModel(session: makeSession())
        viewModel.advance()
        viewModel.finishResting()

        var finishedLogs: [SetLog]?
        viewModel.onFinish = { finishedLogs = $0 }
        viewModel.advance()

        #expect(finishedLogs?.count == 2)
        #expect(finishedLogs?.allSatisfy(\.completed) == true)
        #expect(viewModel.isResting == false)
    }

    @Test func editingTheCurrentStepUpdatesOnlyThatStepsLog() {
        let viewModel = SessionExecutionViewModel(session: makeSession())
        viewModel.updateCurrentLoad("82.5kg")
        viewModel.updateCurrentReps("6")

        #expect(viewModel.setLogs[0]?.actualLoad == "82.5kg")
        #expect(viewModel.setLogs[0]?.actualReps == "6")
        #expect(viewModel.setLogs[1]?.actualLoad == "85kg") // untouched, still planned value
    }
}

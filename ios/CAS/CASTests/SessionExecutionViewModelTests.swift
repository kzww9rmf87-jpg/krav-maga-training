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
            format: .standard(modules: [
                SessionModule(
                    module: CapabilityModuleCatalog.strength,
                    exercises: [
                        SessionExercise(
                            exercise: exercise,
                            restGuidance: "90 sec",
                            groups: [SetGroup(kind: .work, sets: [
                                SetSpec(load: .weighted(value: 80, unit: .kg), reps: "5"),
                                SetSpec(load: .weighted(value: 85, unit: .kg), reps: "4"),
                            ])],
                            note: "Note"
                        ),
                    ]
                ),
            ])
        )
    }

    private func makeViewModel(session: TrainingSession) -> SessionExecutionViewModel {
        // Injects a fake notification scheduler — RestTimerService()'s
        // default reaches the real UNUserNotificationCenter, which
        // crashes the unit test host.
        SessionExecutionViewModel(
            session: session,
            restTimer: RestTimerService(notificationScheduler: FakeRestNotificationScheduler())
        )
    }

    @Test func advancingThroughASetWithRestShowsTheRestScreen() {
        let viewModel = makeViewModel(session: makeSession())
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
        let viewModel = makeViewModel(session: makeSession())
        viewModel.advance()
        viewModel.finishResting()
        #expect(viewModel.currentIndex == 1)
        #expect(viewModel.isResting == false)
        #expect(viewModel.isLastStep == true)
    }

    @Test func advancingOnTheLastStepCallsOnFinishWithAllLogs() {
        let viewModel = makeViewModel(session: makeSession())
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
        let viewModel = makeViewModel(session: makeSession())
        viewModel.updateCurrentLoad(.weighted(value: 82.5, unit: .kg))
        viewModel.updateCurrentReps("6")

        #expect(viewModel.setLogs[0]?.actualLoadValue == .weighted(value: 82.5, unit: .kg))
        #expect(viewModel.setLogs[0]?.actualReps == "6")
        #expect(viewModel.setLogs[1]?.actualLoadValue == .weighted(value: 85, unit: .kg)) // untouched, still planned value
    }
}

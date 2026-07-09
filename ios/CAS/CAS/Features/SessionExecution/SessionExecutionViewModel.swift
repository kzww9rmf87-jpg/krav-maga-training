import Foundation
import Observation

/// Walks through `TrainingSession.steps` one at a time — this is the one
/// place in the app that depends on `ExecutionStep` rather than on any
/// specific `SessionFormat`. Adding a future format never touches this
/// type.
@MainActor
@Observable
final class SessionExecutionViewModel {
    let session: TrainingSession
    let steps: [ExecutionStep]
    private(set) var currentIndex = 0
    private(set) var setLogs: [SetLog?]
    private(set) var isResting = false
    let restTimer = RestTimerService()

    /// Set by the presenting view once the last step is validated, so it
    /// can hand the completed logs to `SessionSummaryView`.
    var onFinish: (([SetLog]) -> Void)?

    init(session: TrainingSession) {
        self.session = session
        self.steps = session.steps
        self.setLogs = steps.map { SetLog(step: $0) }
    }

    var currentStep: ExecutionStep? {
        steps.indices.contains(currentIndex) ? steps[currentIndex] : nil
    }

    var isLastStep: Bool {
        currentIndex == steps.count - 1
    }

    var progressText: String {
        guard !steps.isEmpty else { return "" }
        return "\(currentIndex + 1) / \(steps.count)"
    }

    func updateCurrentLoad(_ load: String) {
        setLogs[currentIndex]?.actualLoad = load
    }

    func updateCurrentReps(_ reps: String) {
        setLogs[currentIndex]?.actualReps = reps
    }

    /// Validates the current step and either rests (if the plan calls for
    /// it and there's a next step to rest before) or moves straight on.
    func advance() {
        setLogs[currentIndex]?.completed = true
        if let seconds = currentStep?.restAfter?.seconds, !isLastStep {
            isResting = true
            restTimer.start(seconds: seconds)
        } else {
            proceedToNextStepOrFinish()
        }
    }

    /// Called when the athlete skips the rest, or the countdown reaches
    /// zero and they confirm — UX.md: rest is quiet and never enforced.
    func finishResting() {
        isResting = false
        proceedToNextStepOrFinish()
    }

    private func proceedToNextStepOrFinish() {
        if isLastStep {
            onFinish?(setLogs.compactMap { $0 })
        } else {
            currentIndex += 1
        }
    }
}

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
    let restTimer: RestTimerService
    private let startedAt = Date()

    /// Set by the presenting view once the last step is validated, so it
    /// can hand the completed logs to `SessionSummaryView`.
    var onFinish: (([SetLog]) -> Void)?

    /// Alpha 1.1, item 6: real elapsed time for the end-of-session recap
    /// ("durée totale") — distinct from `TrainingSession.
    /// estimatedDurationMinutes`, which is a pre-session guess.
    var elapsedSeconds: Int {
        Int(Date().timeIntervalSince(startedAt))
    }

    /// `restTimer` is injectable — not for production flexibility, but
    /// because its default `RestTimerService()` reaches the real
    /// `UNUserNotificationCenter`, which crashes when exercised from a
    /// unit test host. Tests that don't care about notifications inject
    /// `RestTimerService(notificationScheduler: <fake>)`.
    init(session: TrainingSession, restTimer: RestTimerService = RestTimerService()) {
        self.session = session
        self.steps = session.steps
        self.setLogs = steps.map { SetLog(step: $0) }
        self.restTimer = restTimer
    }

    var currentStep: ExecutionStep? {
        steps.indices.contains(currentIndex) ? steps[currentIndex] : nil
    }

    /// Alpha 1.1, item 3: shown during rest so the athlete can prepare
    /// their equipment before the countdown ends. `nil` on the last step
    /// — nothing comes after it.
    var nextStep: ExecutionStep? {
        let nextIndex = currentIndex + 1
        return steps.indices.contains(nextIndex) ? steps[nextIndex] : nil
    }

    var isLastStep: Bool {
        currentIndex == steps.count - 1
    }

    /// Alpha 2.0, item 4: the percentage always derives from
    /// `progressFraction` — the same value driving the bar's fill — so the
    /// two never disagree.
    var progressText: String {
        guard !steps.isEmpty else { return "" }
        let percent = Int((progressFraction * 100).rounded())
        return "\(currentIndex + 1) / \(steps.count) • \(percent) %"
    }

    /// Alpha 1.1, item 2: fraction of steps completed, for a progress bar.
    var progressFraction: Double {
        guard !steps.isEmpty else { return 0 }
        return Double(currentIndex) / Double(steps.count)
    }

    func updateCurrentLoad(_ load: LoadValue) {
        setLogs[currentIndex]?.actualLoadValue = load
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
    /// Always stops the timer first: without this, a rest ended early by
    /// tapping "Passer" would leave its notification scheduled and fire
    /// "Repos terminé" in the middle of the next exercise.
    func finishResting() {
        restTimer.skip()
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

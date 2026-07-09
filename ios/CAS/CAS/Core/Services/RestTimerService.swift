import Foundation
import Observation

/// Drives the rest countdown between steps. Kept as its own small service
/// rather than folded into `SessionExecutionViewModel` — it is reusable,
/// testable on its own, and self-contained state that has nothing to do
/// with walking through session steps.
@MainActor
@Observable
final class RestTimerService {
    private(set) var remainingSeconds: Int = 0
    private(set) var totalSeconds: Int = 0
    private(set) var isRunning: Bool = false
    private var countdownTask: Task<Void, Never>?

    /// 0 when idle or just started, 1 when the countdown has finished.
    var progress: Double {
        guard totalSeconds > 0 else { return 0 }
        return 1 - (Double(remainingSeconds) / Double(totalSeconds))
    }

    func start(seconds: Int) {
        cancel()
        guard seconds > 0 else { return }
        totalSeconds = seconds
        remainingSeconds = seconds
        isRunning = true
        countdownTask = Task { [weak self] in
            while true {
                try? await Task.sleep(for: .seconds(1))
                guard let self, !Task.isCancelled else { return }
                self.remainingSeconds -= 1
                if self.remainingSeconds <= 0 {
                    self.remainingSeconds = 0
                    self.isRunning = false
                    return
                }
            }
        }
    }

    /// The athlete chooses to move on before the countdown reaches zero —
    /// UX.md: rest periods are quiet, never enforced.
    func skip() {
        cancel()
        remainingSeconds = 0
        isRunning = false
    }

    private func cancel() {
        countdownTask?.cancel()
        countdownTask = nil
    }
}

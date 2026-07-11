import Foundation
import Observation

/// Drives the rest countdown between steps. Kept as its own small service
/// rather than folded into `SessionExecutionViewModel` — it is reusable,
/// testable on its own, and self-contained state that has nothing to do
/// with walking through session steps.
///
/// Alpha 1.1: the source of truth is `endDate`, a wall-clock timestamp —
/// not a counter decremented once a second. A counter only advances while
/// something keeps running it, and iOS suspends that the moment the app
/// backgrounds or the phone locks; a countdown that "paused" there would
/// resume from a stale value and run long. Computing `remainingSeconds`
/// from `endDate` vs `Date()` is correct no matter how long the app was
/// away — `refresh()` is what re-syncs it, called both by the internal
/// display loop (while visible) and by the view on scenePhase changes
/// (after being away). See `RestNotificationScheduler` for how the
/// athlete is alerted while the app isn't actually visible to look at.
@MainActor
@Observable
final class RestTimerService {
    private(set) var remainingSeconds: Int = 0
    private(set) var totalSeconds: Int = 0
    private(set) var isRunning: Bool = false
    private var endDate: Date?
    private var displayTask: Task<Void, Never>?
    private let notificationScheduler: RestNotificationScheduling

    /// 0 when idle or just started, 1 when the countdown has finished.
    var progress: Double {
        guard totalSeconds > 0 else { return 0 }
        return 1 - (Double(remainingSeconds) / Double(totalSeconds))
    }

    init(notificationScheduler: RestNotificationScheduling = RestNotificationScheduler()) {
        self.notificationScheduler = notificationScheduler
    }

    func start(seconds: Int) {
        cancelDisplayLoop()
        guard seconds > 0 else {
            endDate = nil
            return
        }
        totalSeconds = seconds
        remainingSeconds = seconds
        endDate = Date().addingTimeInterval(TimeInterval(seconds))
        isRunning = true
        notificationScheduler.schedule(after: seconds)
        startDisplayLoop()
    }

    /// Re-syncs `remainingSeconds` from the wall clock — call this
    /// whenever the view holding the timer becomes visible again
    /// (scenePhase → `.active`), not just while the internal display loop
    /// is already running.
    func refresh() {
        guard isRunning, let endDate else { return }
        let remaining = Int(endDate.timeIntervalSinceNow.rounded(.up))
        remainingSeconds = max(0, remaining)
        if remainingSeconds == 0 {
            isRunning = false
            cancelDisplayLoop()
        }
    }

    /// The athlete chooses to move on before the countdown reaches zero —
    /// UX.md: rest periods are quiet, never enforced.
    func skip() {
        notificationScheduler.cancel()
        cancelDisplayLoop()
        endDate = nil
        remainingSeconds = 0
        isRunning = false
    }

    private func startDisplayLoop() {
        displayTask = Task { [weak self] in
            while true {
                guard let self, !Task.isCancelled else { return }
                self.refresh()
                guard self.isRunning else { return }
                try? await Task.sleep(for: .seconds(1))
            }
        }
    }

    private func cancelDisplayLoop() {
        displayTask?.cancel()
        displayTask = nil
    }
}

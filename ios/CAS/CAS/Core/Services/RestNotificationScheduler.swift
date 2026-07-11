import Foundation
// UNNotificationSettings isn't marked Sendable in the SDK yet, which
// Swift 6 strict concurrency would otherwise reject at the `await
// center.notificationSettings()` call below — @preconcurrency defers to
// the framework's own (correct, Apple-internal) thread-safety instead of
// requiring a Sendable annotation it doesn't have.
@preconcurrency import UserNotifications

/// Alerts the athlete when rest ends even if the phone is locked or the
/// app is backgrounded — Alpha 1.1's "chronomètre robuste." A local
/// notification is scheduled once, at rest-start time, rather than
/// anything trying to keep running continuously in the background (the
/// countdown itself is wall-clock based — see `RestTimerService` — so
/// there's nothing to keep alive either way).
///
/// Silent no-op if the athlete never authorized notifications, and only
/// asks the first time a rest period actually needs one — not at app
/// launch out of context.
@MainActor
protocol RestNotificationScheduling {
    func schedule(after seconds: Int)
    func cancel()
}

@MainActor
final class RestNotificationScheduler: RestNotificationScheduling {
    private static let requestId = "cas.rest-timer"
    private let center = UNUserNotificationCenter.current()

    func schedule(after seconds: Int) {
        cancel()
        guard seconds > 0 else { return }
        // A `Task {}` created from a @MainActor method inherits that
        // isolation, so `self`/`center` stay safe to touch directly
        // across every `await` below — no completion-handler closure
        // ever runs on a background queue and reaches back into this
        // MainActor-isolated instance. That was the bug in the first
        // version of this method: UNUserNotificationCenter's completion-
        // handler APIs call back on an arbitrary queue, and dereferencing
        // `self` there tripped Swift's actor-isolation runtime check —
        // crashed instantly, every time, the moment a rest period first
        // needed a notification.
        Task { [weak self] in
            guard let self else { return }
            let settings = await center.notificationSettings()
            switch settings.authorizationStatus {
            case .authorized, .provisional:
                submitRequest(after: seconds)
            case .notDetermined:
                let granted = (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
                guard granted else { return }
                submitRequest(after: seconds)
            case .denied, .ephemeral:
                break
            @unknown default:
                break
            }
        }
    }

    /// Called whenever the wait it was scheduled for is no longer
    /// relevant — the athlete skipped, the countdown finished normally,
    /// or the next step already started. Never leaves a stray "repos
    /// terminé" alert to fire mid-exercise.
    func cancel() {
        center.removePendingNotificationRequests(withIdentifiers: [Self.requestId])
    }

    private func submitRequest(after seconds: Int) {
        let content = UNMutableNotificationContent()
        content.title = "Repos terminé"
        content.body = "C'est reparti."
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: TimeInterval(seconds), repeats: false)
        center.add(UNNotificationRequest(identifier: Self.requestId, content: content, trigger: trigger))
    }
}

import Foundation
import UserNotifications

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
        center.getNotificationSettings { [weak self] settings in
            guard let self else { return }
            switch settings.authorizationStatus {
            case .authorized, .provisional:
                Task { @MainActor in self.submitRequest(after: seconds) }
            case .notDetermined:
                self.center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
                    guard granted else { return }
                    Task { @MainActor in self.submitRequest(after: seconds) }
                }
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

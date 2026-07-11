import Testing
@testable import CAS

/// Shared across test files. Deliberately not `private`: `RestTimerService()`'s
/// default `RestNotificationScheduler()` reaches the real
/// `UNUserNotificationCenter`, which crashes the unit test host — every
/// test that touches a `RestTimerService` (directly or through
/// `SessionExecutionViewModel`) must inject this instead.
@MainActor
final class FakeRestNotificationScheduler: RestNotificationScheduling {
    private(set) var scheduledSeconds: [Int] = []
    private(set) var cancelCount = 0

    func schedule(after seconds: Int) {
        scheduledSeconds.append(seconds)
    }

    func cancel() {
        cancelCount += 1
    }
}

@MainActor
struct RestTimerServiceTests {

    private func makeTimer() -> RestTimerService {
        RestTimerService(notificationScheduler: FakeRestNotificationScheduler())
    }

    @Test func startingSetsRunningStateAndFullDuration() {
        let timer = makeTimer()
        timer.start(seconds: 30)
        #expect(timer.isRunning == true)
        #expect(timer.remainingSeconds == 30)
        #expect(timer.progress == 0)
    }

    @Test func skippingStopsImmediatelyRegardlessOfTimeLeft() {
        let timer = makeTimer()
        timer.start(seconds: 300)
        timer.skip()
        #expect(timer.isRunning == false)
        #expect(timer.remainingSeconds == 0)
    }

    @Test func startingWithZeroSecondsDoesNothing() {
        let timer = makeTimer()
        timer.start(seconds: 0)
        #expect(timer.isRunning == false)
    }

    @Test func countdownReachesZeroAndStopsOnItsOwn() async throws {
        let timer = makeTimer()
        timer.start(seconds: 1)
        try await Task.sleep(for: .milliseconds(1300))
        #expect(timer.remainingSeconds == 0)
        #expect(timer.isRunning == false)
    }

    @Test func refreshRecomputesFromTheWallClockRatherThanATickCount() async throws {
        // The point of the Date-based rewrite: even if nothing had a
        // chance to tick (simulating time away in the background),
        // `refresh()` alone must produce the right remaining time.
        let timer = makeTimer()
        timer.start(seconds: 5)
        try await Task.sleep(for: .milliseconds(1100))
        timer.refresh()
        #expect(timer.remainingSeconds <= 4)
        #expect(timer.remainingSeconds >= 3)
        #expect(timer.isRunning == true)
    }

    @Test func startingSchedulesANotificationForTheRestDuration() {
        let scheduler = FakeRestNotificationScheduler()
        let timer = RestTimerService(notificationScheduler: scheduler)
        timer.start(seconds: 90)
        #expect(scheduler.scheduledSeconds == [90])
    }

    @Test func skippingCancelsTheScheduledNotification() {
        let scheduler = FakeRestNotificationScheduler()
        let timer = RestTimerService(notificationScheduler: scheduler)
        timer.start(seconds: 90)
        timer.skip()
        #expect(scheduler.cancelCount == 1)
    }

    @Test func startingASecondTimeSchedulesAgainForTheNewDuration() {
        // RestTimerService.start() always schedules for the current call's
        // duration — it's the concrete RestNotificationScheduler's own
        // responsibility (see its `schedule(after:)`) to replace any
        // still-pending request, not something a fake needs to replicate
        // to verify this contract.
        let scheduler = FakeRestNotificationScheduler()
        let timer = RestTimerService(notificationScheduler: scheduler)
        timer.start(seconds: 90)
        timer.start(seconds: 60)
        #expect(scheduler.scheduledSeconds == [90, 60])
    }
}

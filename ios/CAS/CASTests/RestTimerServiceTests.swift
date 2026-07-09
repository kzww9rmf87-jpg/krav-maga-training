import Testing
@testable import CAS

@MainActor
struct RestTimerServiceTests {

    @Test func startingSetsRunningStateAndFullDuration() {
        let timer = RestTimerService()
        timer.start(seconds: 30)
        #expect(timer.isRunning == true)
        #expect(timer.remainingSeconds == 30)
        #expect(timer.progress == 0)
    }

    @Test func skippingStopsImmediatelyRegardlessOfTimeLeft() {
        let timer = RestTimerService()
        timer.start(seconds: 300)
        timer.skip()
        #expect(timer.isRunning == false)
        #expect(timer.remainingSeconds == 0)
    }

    @Test func startingWithZeroSecondsDoesNothing() {
        let timer = RestTimerService()
        timer.start(seconds: 0)
        #expect(timer.isRunning == false)
    }

    @Test func countdownReachesZeroAndStopsOnItsOwn() async throws {
        let timer = RestTimerService()
        timer.start(seconds: 1)
        try await Task.sleep(for: .milliseconds(1300))
        #expect(timer.remainingSeconds == 0)
        #expect(timer.isRunning == false)
    }
}

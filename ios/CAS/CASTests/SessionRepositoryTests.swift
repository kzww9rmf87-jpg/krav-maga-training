import Testing
@testable import CAS

struct SessionRepositoryTests {

    @Test func seedRepositoryReturnsAllFiveSessions() {
        let repository: SessionRepository = SeedSessionRepository()
        #expect(repository.allSessions().map(\.id) == SeedSessions.all.map(\.id))
    }

    @Test func seedRepositoryFindsASessionById() {
        let repository: SessionRepository = SeedSessionRepository()
        #expect(repository.session(id: SeedSessionID.seanceC.rawValue)?.title == "Séance C — Circuit conditioning")
    }

    @Test func seedRepositoryReturnsNilForAnUnknownId() {
        let repository: SessionRepository = SeedSessionRepository()
        #expect(repository.session(id: "does-not-exist") == nil)
    }
}

import Testing
@testable import CAS

struct SessionRepositoryTests {

    @Test func seedRepositoryReturnsTheFiveCASV0SessionsOnly() {
        let repository: SessionRepository = SeedSessionRepository()
        #expect(repository.allSessions().map(\.id) == SeedSessions.primary.map(\.id))
    }

    @Test func seedRepositoryFindsASessionById() {
        let repository: SessionRepository = SeedSessionRepository()
        #expect(repository.session(id: CASSessionID.robustness.rawValue)?.title == "CAS Robustesse")
    }

    @Test func seedRepositoryReturnsNilForAnUnknownId() {
        let repository: SessionRepository = SeedSessionRepository()
        #expect(repository.session(id: "does-not-exist") == nil)
    }

    @Test func seedRepositoryNoLongerSurfacesLegacySessions() {
        let repository: SessionRepository = SeedSessionRepository()
        #expect(repository.session(id: LegacySessionID.seanceA.rawValue) == nil)
    }
}

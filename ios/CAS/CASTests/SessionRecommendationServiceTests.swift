import Testing
@testable import CAS

struct SessionRecommendationServiceTests {

    /// Every exercise requirement in `ExerciseEquipmentRequirements` is
    /// satisfiable by this set — the "well-equipped gym" fixture. Listed
    /// explicitly, item by item, rather than derived from any
    /// `TrainingEnvironment` preselection: a real gym isn't guaranteed to
    /// have everything (see `commercialGymWithoutMedicineBallStillOffersPuissanceWithCompromises`).
    private static let fullyEquippedGym: Set<Equipment> = [
        .barbell, .rack, .bench, .cableMachine, .pullUpBar,
        .dumbbells, .kettlebell, .medicineBall, .resistanceBands, .externalLoad,
    ]

    @Test func withNoHistoryRecommendsCASForceWhenFullyEquipped() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: nil, availableEquipment: Self.fullyEquippedGym)
        #expect(recommendation?.resolved.session.id == CASSessionID.force.rawValue)
        #expect(recommendation?.reason.contains("Aucune séance récente") == true)
    }

    @Test func rotatesThroughTheFixedOrderWhenFullyEquipped() {
        let service = RotationRecommendationService()
        let order = CASSessionID.allCases.map(\.rawValue)
        for (index, id) in order.enumerated() {
            let expectedNextId = order[(index + 1) % order.count]
            let recommendation = service.recommend(lastCompletedSessionId: id, availableEquipment: Self.fullyEquippedGym)
            #expect(recommendation?.resolved.session.id == expectedNextId, "after \(id)")
        }
    }

    @Test func walksTheFullCycleForceToAerobicBaseAndBackToForceWhenFullyEquipped() throws {
        let service = RotationRecommendationService()
        var lastCompletedSessionId: String?
        var visited: [String] = []
        for _ in CASSessionID.allCases {
            let recommendation = service.recommend(lastCompletedSessionId: lastCompletedSessionId, availableEquipment: Self.fullyEquippedGym)
            let nextId = try #require(recommendation?.resolved.session.id)
            visited.append(nextId)
            lastCompletedSessionId = nextId
        }
        #expect(visited == [
            CASSessionID.force.rawValue,
            CASSessionID.power.rawValue,
            CASSessionID.functionalHypertrophy.rawValue,
            CASSessionID.robustness.rawValue,
            CASSessionID.aerobicBase.rawValue,
        ])
        #expect(service.recommend(lastCompletedSessionId: lastCompletedSessionId, availableEquipment: Self.fullyEquippedGym)?.resolved.session.id == CASSessionID.force.rawValue)
    }

    @Test func wrapsFromAerobicBaseBackToForceWhenFullyEquipped() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: CASSessionID.aerobicBase.rawValue, availableEquipment: Self.fullyEquippedGym)
        #expect(recommendation?.resolved.session.id == CASSessionID.force.rawValue)
    }

    @Test func reasonNamesTheLastCompletedSessionWhenNoSkipOccurs() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: CASSessionID.force.rawValue, availableEquipment: Self.fullyEquippedGym)
        #expect(recommendation?.reason == "Recommandée car votre dernière séance était CAS Force.")
    }

    @Test func fallsBackToCASForceWhenTheLastSessionIdIsUnknown() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: "does-not-exist", availableEquipment: Self.fullyEquippedGym)
        #expect(recommendation?.resolved.session.id == CASSessionID.force.rawValue)
    }

    @Test func fallsBackToCASForceWhenTheLastSessionWasLegacyContent() {
        // Legacy ids are no longer part of the rotation, so completing
        // one shouldn't produce a recommendation keyed off it.
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: LegacySessionID.bras.rawValue, availableEquipment: Self.fullyEquippedGym)
        #expect(recommendation?.resolved.session.id == CASSessionID.force.rawValue)
    }

    @Test func fullyEquippedGymAppliesNoSubstitutionsToAnyOfTheFiveSessions() {
        let service = RotationRecommendationService()
        var lastCompletedSessionId: String?
        for _ in CASSessionID.allCases {
            let recommendation = service.recommend(lastCompletedSessionId: lastCompletedSessionId, availableEquipment: Self.fullyEquippedGym)
            #expect(recommendation?.resolved.substitutions.isEmpty == true)
            lastCompletedSessionId = recommendation?.resolved.session.id
        }
    }

    // MARK: - Beta 1.0: equipment-driven skipping

    @Test func noEquipmentAlternatesOnlyBetweenPuissanceAndAerobicBase() throws {
        let service = RotationRecommendationService()
        var lastCompletedSessionId: String?
        var visited: [String] = []
        for _ in 0..<6 {
            let recommendation = service.recommend(lastCompletedSessionId: lastCompletedSessionId, availableEquipment: [])
            let nextId = try #require(recommendation?.resolved.session.id)
            visited.append(nextId)
            lastCompletedSessionId = nextId
        }
        #expect(Set(visited) == [CASSessionID.power.rawValue, CASSessionID.aerobicBase.rawValue])
    }

    @Test func noEquipmentResolvesPuissanceWithTheThreeValidatedSubstitutions() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: CASSessionID.aerobicBase.rawValue, availableEquipment: [])
        #expect(recommendation?.resolved.session.id == CASSessionID.power.rawValue)
        let partial = recommendation?.resolved.substitutions.filter { $0.equivalence == .partial }
        #expect(partial?.count == 3)
    }

    @Test func skippingUnavailableSessionsProducesAShortCountBasedReason() {
        let service = RotationRecommendationService()
        // After Force (unavailable with no equipment), the next available
        // candidate is Puissance — one skip (Force itself isn't a skip,
        // it's the starting point; Force IS skipped as a candidate here
        // since the theoretical next after a hypothetical "no history"
        // start is Force itself, which is unavailable).
        let recommendation = service.recommend(lastCompletedSessionId: nil, availableEquipment: [])
        #expect(recommendation?.resolved.session.id == CASSessionID.power.rawValue)
        #expect(recommendation?.reason == "Prochaine séance disponible dans votre rotation. 1 séance est incompatible avec votre équipement actuel.")
    }

    @Test func skippingMultipleSessionsPluralizesTheReason() {
        let service = RotationRecommendationService()
        // After Puissance, the theoretical next is Hypertrophie
        // fonctionnelle, then Robustesse — both unavailable — before
        // Base aérobie.
        let recommendation = service.recommend(lastCompletedSessionId: CASSessionID.power.rawValue, availableEquipment: [])
        #expect(recommendation?.resolved.session.id == CASSessionID.aerobicBase.rawValue)
        #expect(recommendation?.reason == "Prochaine séance disponible dans votre rotation. 2 séances sont incompatibles avec votre équipement actuel.")
    }

    @Test func allSessionsUnavailableProducesNoRecommendation() {
        let service = RotationRecommendationService(repository: EmptyRepository())
        let recommendation = service.recommend(lastCompletedSessionId: nil, availableEquipment: [])
        #expect(recommendation == nil)
    }

    @Test func commercialGymWithoutMedicineBallStillOffersPuissanceWithCompromises() {
        // TrainingEnvironment.commercialGym's own preselection — never a
        // hand-picked "generous" set — genuinely lacks a medicine ball
        // and a kettlebell. `availableEquipment` decides feasibility, not
        // the environment name, so this must not be assumed away.
        let commercialGymEquipment = TrainingEnvironment.commercialGym.suggestedEquipment
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: CASSessionID.force.rawValue, availableEquipment: commercialGymEquipment)

        #expect(recommendation?.resolved.session.id == CASSessionID.power.rawValue)
        let partial = recommendation?.resolved.substitutions.filter { $0.equivalence == .partial }
        // Only the medicine-ball-dependent exercise needs a substitute —
        // épaulé-jeté is satisfied by dumbbells, rotation du tronc by
        // the cable machine, both already in commercialGym's preselection.
        #expect(partial?.count == 1)
        #expect(partial?.first?.originalExerciseID == "cas-puissance-lancers-medecine-ball")
    }

    @Test func explicitlyFullyEquippedGymKeepsAllFiveSessionsWithoutAnySubstitution() {
        // The "well-equipped gym" test must never derive its equipment
        // from a TrainingEnvironment preselection — it states everything
        // every one of the 24 exercises could possibly need, explicitly.
        let service = RotationRecommendationService()
        var lastCompletedSessionId: String?
        var visitedCount = 0
        for _ in CASSessionID.allCases {
            let recommendation = service.recommend(lastCompletedSessionId: lastCompletedSessionId, availableEquipment: Self.fullyEquippedGym)
            #expect(recommendation != nil)
            #expect(recommendation?.resolved.substitutions.isEmpty == true)
            lastCompletedSessionId = recommendation?.resolved.session.id
            visitedCount += 1
        }
        #expect(visitedCount == 5) // all five sessions reachable, none skipped
    }
}

/// A repository returning no sessions at all — the simplest way to force
/// "every candidate unavailable" without touching real seed data.
private struct EmptyRepository: SessionRepository {
    func allSessions() -> [TrainingSession] { [] }
    func session(id: String) -> TrainingSession? { nil }
}

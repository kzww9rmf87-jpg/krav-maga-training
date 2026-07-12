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

    /// Beta 1.0: with no equipment, Force/Hypertrophie fonctionnelle/
    /// Robustesse each resolve via their bodyweight-native counterpart
    /// (not a skip anymore), Puissance still resolves via its
    /// substitution table, and Base aérobie needs nothing to begin with —
    /// so a full cycle now visits all five conceptual slots, three of
    /// them under their bodyweight id.
    @Test func noEquipmentWalksAllFiveSlotsUsingBodyweightNativeWhereAvailable() throws {
        let service = RotationRecommendationService()
        var lastCompletedSessionId: String?
        var visited: [String] = []
        for _ in CASSessionID.allCases {
            let recommendation = service.recommend(lastCompletedSessionId: lastCompletedSessionId, availableEquipment: [])
            let nextId = try #require(recommendation?.resolved.session.id)
            visited.append(nextId)
            lastCompletedSessionId = nextId
        }
        #expect(visited == [
            CASForceBodyweight.session.id,
            CASSessionID.power.rawValue,
            CASHypertrophieBodyweight.session.id,
            CASRobustesseBodyweight.session.id,
            CASSessionID.aerobicBase.rawValue,
        ])
    }

    /// A completed bodyweight session must advance the rotation exactly
    /// as if its gym counterpart had been completed — `rotationSlot`'s
    /// whole purpose.
    @Test func recommendationContinuesRotationAfterABodyweightSessionWasLastCompleted() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: CASForceBodyweight.session.id, availableEquipment: Self.fullyEquippedGym)
        #expect(recommendation?.resolved.session.id == CASSessionID.power.rawValue)
    }

    /// The explicitly validated Beta 1.0 behavior change: a no-equipment
    /// profile with no history now recommends the native bodyweight
    /// implementation of the first rotation slot, not a skip straight to
    /// CAS Puissance.
    @Test func recommendationForNoEquipmentAndNoHistoryIsForceBodyweight() {
        let service = RotationRecommendationService()
        let recommendation = service.recommend(lastCompletedSessionId: nil, availableEquipment: [])
        #expect(recommendation?.resolved.session.id == CASForceBodyweight.session.id)
        #expect(recommendation?.reason == "Aucune séance récente — on commence par CAS Force — Poids du corps.")
    }

    @Test func noEquipmentResolvesPuissanceWithTheThreeValidatedSubstitutions() {
        let service = RotationRecommendationService()
        // Force (bodyweight-native) is the slot right before Puissance —
        // completing it is what makes Puissance the next candidate.
        let recommendation = service.recommend(lastCompletedSessionId: CASSessionID.force.rawValue, availableEquipment: [])
        #expect(recommendation?.resolved.session.id == CASSessionID.power.rawValue)
        let partial = recommendation?.resolved.substitutions.filter { $0.equivalence == .partial }
        #expect(partial?.count == 3)
    }

    /// Beta 1.0 note: with real content, a genuine equipment-driven skip
    /// is now only reachable through CAS Puissance — Force/Hypertrophie
    /// fonctionnelle/Robustesse always resolve via their bodyweight-
    /// native counterpart, Base aérobie needs no equipment to begin
    /// with, and Puissance's own substitution table already covers a
    /// zero-equipment profile in practice. Since the two slots without a
    /// bodyweight counterpart (Puissance, Base aérobie) are never
    /// adjacent in the rotation without Force/Hypertrophie/Robustesse
    /// between them, a *plural* skip (2+ in a row) is no longer
    /// reachable at all with real content — only this fixture, which
    /// forces a single genuine skip, remains to verify the skip-and-
    /// explain mechanism itself still works.
    @Test func skippingAnUndocumentedCandidateWithNoFallbackProducesASingularCountBasedReason() {
        let service = RotationRecommendationService(repository: UndocumentedPuissanceRepository())
        let recommendation = service.recommend(lastCompletedSessionId: CASSessionID.force.rawValue, availableEquipment: [])
        #expect(recommendation?.resolved.session.id == CASHypertrophieBodyweight.session.id)
        #expect(recommendation?.reason == "Prochaine séance disponible dans votre rotation. 1 séance est incompatible avec votre équipement actuel.")
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

/// Keeps all four other CAS V0.1 sessions real, but swaps CAS Puissance
/// for a fixture with one undocumented exercise — the only way left to
/// force a genuine equipment-driven skip, since Force/Hypertrophie
/// fonctionnelle/Robustesse always fall back to their bodyweight-native
/// counterpart regardless of what this repository returns for them
/// (`SessionImplementationSelector.bodyweightCounterpart` isn't
/// injectable, by design — it's real content, not a fixture).
private struct UndocumentedPuissanceRepository: SessionRepository {
    private let real = SeedSessionRepository()
    private let broken = TrainingSession(
        id: CASSessionID.power.rawValue,
        title: "CAS Puissance (fixture)",
        subtitle: "test fixture",
        format: .standard(modules: [
            SessionModule(module: CapabilityModuleCatalog.power, exercises: [
                SessionExercise(
                    exercise: Exercise(id: "test-undocumented-exercise", name: "Test", primaryAdaptation: .power),
                    groups: [SetGroup(kind: .work, sets: [SetSpec(load: .bodyweight, reps: "5")])],
                    note: "test"
                ),
            ]),
        ])
    )

    func allSessions() -> [TrainingSession] {
        real.allSessions().map { $0.id == broken.id ? broken : $0 }
    }

    func session(id: String) -> TrainingSession? {
        id == broken.id ? broken : real.session(id: id)
    }
}

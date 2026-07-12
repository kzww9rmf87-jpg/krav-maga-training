import Testing
@testable import CAS

struct EquipmentPrefillAdvisorTests {

    @Test func noActionWhenTheEnvironmentDoesNotActuallyChange() {
        let decision = EquipmentPrefillAdvisor.decision(
            currentEquipment: [.barbell, .rack],
            previousEnvironment: .commercialGym,
            newEnvironment: .commercialGym
        )
        #expect(decision == .noAction)
    }

    @Test func appliesAutomaticallyWhenTheSelectionStillMatchesThePreviousSuggestion() {
        // Nothing manual to lose: the current selection *is* the previous
        // environment's own suggestion.
        let decision = EquipmentPrefillAdvisor.decision(
            currentEquipment: TrainingEnvironment.homeGym.suggestedEquipment,
            previousEnvironment: .homeGym,
            newEnvironment: .commercialGym
        )
        #expect(decision == .appliedAutomatically(TrainingEnvironment.commercialGym.suggestedEquipment))
    }

    @Test func firstEverChoiceAppliesAutomaticallyFromTheEmptyBodyweightDefault() {
        // The starting point (bodyweightOnly, no equipment) trivially
        // equals bodyweightOnly's own (empty) suggestion.
        let decision = EquipmentPrefillAdvisor.decision(
            currentEquipment: [],
            previousEnvironment: .bodyweightOnly,
            newEnvironment: .combatGym
        )
        #expect(decision == .appliedAutomatically(TrainingEnvironment.combatGym.suggestedEquipment))
    }

    @Test func needsConfirmationWhenTheSelectionHasBeenManuallyCustomized() {
        let decision = EquipmentPrefillAdvisor.decision(
            currentEquipment: [.kettlebell], // not homeGym's suggestion
            previousEnvironment: .homeGym,
            newEnvironment: .commercialGym
        )
        #expect(decision == .needsConfirmation(suggested: TrainingEnvironment.commercialGym.suggestedEquipment))
    }

    @Test func aCustomSelectionIsNeverReplacedOrReducedByTheDecisionItself() {
        // `.needsConfirmation` only ever *suggests* — it must not mutate
        // or discard what's already selected.
        let current: Set<Equipment> = [.kettlebell, .medicineBall]
        let decision = EquipmentPrefillAdvisor.decision(
            currentEquipment: current,
            previousEnvironment: .homeGym,
            newEnvironment: .commercialGym
        )
        guard case .needsConfirmation = decision else {
            Issue.record("Expected .needsConfirmation")
            return
        }
        // The caller's own copy of `current` is untouched — nothing about
        // computing a decision can silently drop or replace it.
        #expect(current == [.kettlebell, .medicineBall])
    }

    @Test func confirmingAddsTheUnionWithoutRemovingAnythingAlreadySelected() {
        let current: Set<Equipment> = [.kettlebell, .medicineBall]
        let suggested: Set<Equipment> = [.medicineBall, .heavyBag]

        let result = EquipmentPrefillAdvisor.applyingConfirmedSuggestion(suggested, to: current)

        #expect(result == [.kettlebell, .medicineBall, .heavyBag])
    }

    @Test func bodyweightOnlyNeverAutomaticallyStripsEquipmentTheAthleteDeclared() {
        // A manually-kept pull-up bar/bands must survive switching *to*
        // bodyweightOnly — its suggestion is empty, but empty means "add
        // nothing," never "remove what's there."
        let decision = EquipmentPrefillAdvisor.decision(
            currentEquipment: [.pullUpBar, .resistanceBands],
            previousEnvironment: .homeGym,
            newEnvironment: .bodyweightOnly
        )
        guard case .needsConfirmation(let suggested) = decision else {
            Issue.record("Expected .needsConfirmation since the selection diverges from homeGym's suggestion")
            return
        }
        #expect(suggested.isEmpty)
        // Even if confirmed, the union with an empty suggestion changes nothing.
        #expect(EquipmentPrefillAdvisor.applyingConfirmedSuggestion(suggested, to: [.pullUpBar, .resistanceBands]) == [.pullUpBar, .resistanceBands])
    }
}

import Foundation

/// What to do about `availableEquipment` when `trainingEnvironment` changes
/// during onboarding or profile editing.
enum EquipmentPrefillDecision: Equatable {
    /// The environment didn't actually change — nothing to decide.
    case noAction
    /// The current selection was still exactly the previous environment's
    /// suggestion, so nothing manual exists to lose: safe to replace it
    /// outright with the new environment's suggestion.
    case appliedAutomatically(Set<Equipment>)
    /// The current selection has diverged from the previous environment's
    /// suggestion — a real, manual choice — so the new suggestion is
    /// offered, never applied silently.
    case needsConfirmation(suggested: Set<Equipment>)
}

/// Decides how `TrainingEnvironment` changes should affect
/// `AthleteProfile.availableEquipment` — a pure, UI-independent policy so
/// it's testable without SwiftUI and reusable identically by onboarding
/// and profile editing. Never removes equipment the athlete selected: the
/// only two outcomes that touch the selection either replace it with an
/// equal-or-larger set (when nothing manual would be lost) or add to it by
/// union after explicit confirmation.
enum EquipmentPrefillAdvisor {
    static let confirmationPrompt = "Ajouter le matériel suggéré sans retirer votre sélection actuelle ?"

    static func decision(
        currentEquipment: Set<Equipment>,
        previousEnvironment: TrainingEnvironment,
        newEnvironment: TrainingEnvironment
    ) -> EquipmentPrefillDecision {
        guard newEnvironment != previousEnvironment else { return .noAction }

        if currentEquipment == previousEnvironment.suggestedEquipment {
            return .appliedAutomatically(newEnvironment.suggestedEquipment)
        }
        return .needsConfirmation(suggested: newEnvironment.suggestedEquipment)
    }

    /// The only way `.needsConfirmation`'s suggestion is ever applied —
    /// always a union, so nothing already selected can be removed by it.
    static func applyingConfirmedSuggestion(_ suggested: Set<Equipment>, to current: Set<Equipment>) -> Set<Equipment> {
        current.union(suggested)
    }
}

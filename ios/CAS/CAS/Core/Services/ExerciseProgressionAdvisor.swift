import Foundation

/// A proposal for next time, never an instruction. Alpha 1.1's rule is
/// deliberately simple: numeric load + target reps met → propose the
/// configured increment; qualitative load → hold the same level and let
/// the athlete decide; anything else → no suggestion is invented.
enum ProgressionSuggestion: Equatable {
    /// Every work set was numeric and met its target reps.
    case increase(LoadValue)
    /// Same load/level next time — either qualitative (always, athlete
    /// decides by hand) or numeric but target reps weren't all met.
    case hold(LoadValue)
    /// Mixed load kinds across work sets, custom text, unparseable reps,
    /// or no work sets at all — nothing reliable to propose.
    case unavailable

    var displayText: String {
        switch self {
        case .increase(let load):
            return "Essayez \(load.displayText) la prochaine fois."
        case .hold(.qualitative(let level)):
            return "Conservez \(level.displayName), à ajuster vous-même."
        case .hold(let load):
            return "Conservez \(load.displayText) — objectif non atteint."
        case .unavailable:
            return "Progression non calculable."
        }
    }
}

/// Computes a `ProgressionSuggestion` from one exercise's logged sets.
/// Never applies anything automatically — see `ProgressionSuggestion`'s
/// own doc. Only looks at `.work` sets: warm-up and option sets aren't
/// the exercise's real working intensity, so they're excluded from the
/// decision.
enum ExerciseProgressionAdvisor {
    private static let incrementKg = 2.5
    private static let incrementLb = 5.0

    static func suggestion(for allSets: [SetLog]) -> ProgressionSuggestion {
        let workSets = allSets.filter { $0.groupKind == .work }
        guard let lastWorkSet = workSets.last else { return .unavailable }

        let allQualitative = workSets.allSatisfy {
            if case .qualitative = $0.actualLoadValue { return true }
            return false
        }
        if allQualitative, case .qualitative = lastWorkSet.actualLoadValue {
            return .hold(lastWorkSet.actualLoadValue)
        }

        let allNumeric = workSets.allSatisfy { $0.actualLoadValue.progressionAnchor != nil }
        guard allNumeric else { return .unavailable }

        let allMetTarget = workSets.allSatisfy { set in
            guard
                let target = RepCount.parse(set.plannedReps),
                let achieved = RepCount.parse(set.actualReps)
            else { return false }
            return achieved >= target
        }

        return allMetTarget ? .increase(incremented(lastWorkSet.actualLoadValue)) : .hold(lastWorkSet.actualLoadValue)
    }

    private static func incremented(_ load: LoadValue) -> LoadValue {
        switch load {
        case .weighted(let value, let unit):
            return .weighted(value: value + increment(for: unit), unit: unit)
        case .bodyweightAdded(let value, let unit):
            return .bodyweightAdded(value: value + increment(for: unit), unit: unit)
        case .bodyweightAssisted(let value, let unit):
            // Less assistance is the progression direction here — it
            // means more of the athlete's own bodyweight is being moved.
            return .bodyweightAssisted(value: max(0, value - increment(for: unit)), unit: unit)
        case .bodyweight, .qualitative, .custom:
            return load
        }
    }

    private static func increment(for unit: MassUnit) -> Double {
        unit == .kg ? incrementKg : incrementLb
    }
}

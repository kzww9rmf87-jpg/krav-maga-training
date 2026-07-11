import Foundation

/// Best-effort rep count extracted from free-text reps ("8", "8-10",
/// "10 vitesse max", "Tenue max"). Ranges use their upper bound — the
/// same convention `RestAfter.parse` already uses for rest guidance
/// ranges. Returns nil when there's nothing numeric at all ("Tenue max",
/// "Max reps") — those never contribute to volume or progression math,
/// exactly like qualitative loads don't.
enum RepCount {
    static func parse(_ reps: String) -> Int? {
        let numbers = reps.split(whereSeparator: { !$0.isNumber }).compactMap { Int($0) }
        return numbers.max()
    }
}

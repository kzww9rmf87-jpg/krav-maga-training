import SwiftUI

/// 07_MOTION.md's duration scale, plus a Reduced-Motion-aware animation
/// helper. A pure enum has no access to `@Environment`, so
/// `animation(duration:reduceMotion:)` takes the flag explicitly —
/// callers read `@Environment(\.accessibilityReduceMotion)` themselves
/// and pass it in. Not yet consumed anywhere in `Features/` or
/// `Components/`; this step only builds the token.
enum CASMotion {
    /// Micro interactions: 100–150 ms.
    static let microDuration: Double = 0.12
    /// Standard transitions: 200–250 ms.
    static let standardDuration: Double = 0.225
    /// Large transitions: 300 ms maximum.
    static let largeDuration: Double = 0.3

    /// A calm ease-in-out animation at `duration`, or `nil` when
    /// Reduced Motion is active — 07_MOTION.md "Accessibility": "When
    /// reduced motion is enabled: remove non-essential animations.
    /// Maintain immediate feedback. Accessibility always overrides
    /// aesthetics."
    static func animation(duration: Double, reduceMotion: Bool) -> Animation? {
        reduceMotion ? nil : .easeInOut(duration: duration)
    }
}

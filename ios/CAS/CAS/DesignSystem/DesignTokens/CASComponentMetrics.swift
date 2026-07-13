import Foundation

/// Semantic metrics for specific components — distinct from
/// `CASSpacing`'s primitive scale on purpose. A primitive is a raw,
/// context-free multiple of 4; a semantic metric is a documented
/// override tied to one component's own rule in `04_SPACING.md`, even
/// when that rule doesn't land on a primitive step.
///
/// Example: card padding is specified as exactly 20 px ("never less
/// than 16 px") — not one of `CASSpacing`'s named steps (16 or 24), so
/// it does not belong in the primitive scale. It belongs here instead,
/// as `CASComponentMetrics.cardPadding`.
enum CASComponentMetrics {
    /// 04_SPACING.md "Cards — Internal padding: 20 px. Never less than
    /// 16 px."
    static let cardPadding: CGFloat = 20
}

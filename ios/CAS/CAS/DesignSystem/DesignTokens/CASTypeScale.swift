import SwiftUI

/// 03_TYPOGRAPHY.md's 8-step font scale, each step pinned to its
/// nominal point size via `@ScaledMetric` — the native, fully-system
/// mechanism for "a fixed base size that still scales with the
/// athlete's Dynamic Type setting." Every font is built with
/// `Font.system(size:weight:)`: SF Pro remains the system font
/// throughout, never referenced by name, never treated as a bundled
/// custom typeface.
///
/// This is a `DynamicProperty`, not a static enum, because
/// `@ScaledMetric` only re-resolves against the live Dynamic Type
/// environment when it is a stored property of a `View` (or of another
/// `DynamicProperty` composed into one). A `static let` would freeze
/// whichever size category was active the first time it was read and
/// never update again. Consuming views will instantiate this as a
/// plain property once they migrate onto it, e.g.
/// `private var typeScale = CASTypeScale()`.
///
/// Not yet consumed anywhere. `CASTypography` (the legacy, unchanged
/// static enum every current Component and Screen already reads) stays
/// exactly as it is until that migration happens — see its own doc
/// comment.
struct CASTypeScale: DynamicProperty {
    @ScaledMetric(relativeTo: .largeTitle) private var displaySize: CGFloat = 36
    @ScaledMetric(relativeTo: .title) private var heading1Size: CGFloat = 30
    @ScaledMetric(relativeTo: .title2) private var heading2Size: CGFloat = 24
    @ScaledMetric(relativeTo: .title3) private var heading3Size: CGFloat = 20
    @ScaledMetric(relativeTo: .body) private var bodyLargeSize: CGFloat = 18
    @ScaledMetric(relativeTo: .body) private var bodySize: CGFloat = 16
    @ScaledMetric(relativeTo: .footnote) private var captionSize: CGFloat = 14
    @ScaledMetric(relativeTo: .caption2) private var smallCaptionSize: CGFloat = 12

    /// 36 pt, Bold — home screen, major statistics, workout completion.
    var display: Font { .system(size: displaySize, weight: .bold) }
    /// 30 pt, Bold — screen titles.
    var heading1: Font { .system(size: heading1Size, weight: .bold) }
    /// 24 pt, Semibold — section titles, exercise names.
    var heading2: Font { .system(size: heading2Size, weight: .semibold) }
    /// 20 pt, Semibold — card titles, statistics.
    var heading3: Font { .system(size: heading3Size, weight: .semibold) }
    /// 18 pt, Regular — primary body text, training instructions.
    var bodyLarge: Font { .system(size: bodyLargeSize, weight: .regular) }
    /// 16 pt, Regular — standard interface text, lists, descriptions.
    var body: Font { .system(size: bodySize, weight: .regular) }
    /// 14 pt, Regular — supporting information, dates, units, metadata.
    var caption: Font { .system(size: captionSize, weight: .regular) }
    /// 12 pt, Regular — rare, only when absolutely necessary.
    var smallCaption: Font { .system(size: smallCaptionSize, weight: .regular) }
}

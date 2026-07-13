import SwiftUI

/// Legacy semantic type styles — unchanged from before this Design
/// System foundation work, relocated here only. Every value is a
/// relative system text style (`.largeTitle`, `.title2`, `.body`,
/// `.subheadline`), which is already fully Dynamic-Type-correct and
/// never names a custom font.
///
/// This is the surface every existing `Component` and `Screen` reads
/// today (`CASTypography.sessionTitle`, etc.) as a bare static
/// property — deliberately preserved exactly as-is so nothing outside
/// `DesignSystem/` needs to change in this step. `CASTypeScale` is the
/// new, doc-accurate 8-level scale from `03_TYPOGRAPHY.md`; migrating
/// these call sites onto it is Step 2's job, not this one.
enum CASTypography {
    static let sessionTitle = Font.largeTitle.weight(.bold)
    static let sectionTitle = Font.title2.weight(.semibold)
    static let body = Font.body
    static let caption = Font.subheadline

    /// The one large, glanceable number shown during a rest countdown.
    static let restTimer = Font.system(.largeTitle, design: .rounded).weight(.bold)
}

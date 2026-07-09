import SwiftUI

/// 30-product/DESIGN_SYSTEM.md: "Large titles. Short sentences. Minimal
/// text. Readable at arm's length inside a gym." All styles are relative
/// system text styles (never a fixed point size) so Dynamic Type keeps
/// working — UX.md lists this under Accessibility explicitly.
enum CASTypography {
    static let sessionTitle = Font.largeTitle.weight(.bold)
    static let sectionTitle = Font.title2.weight(.semibold)
    static let body = Font.body
    static let caption = Font.subheadline

    /// The one large, glanceable number shown during a rest countdown.
    static let restTimer = Font.system(.largeTitle, design: .rounded).weight(.bold)
}

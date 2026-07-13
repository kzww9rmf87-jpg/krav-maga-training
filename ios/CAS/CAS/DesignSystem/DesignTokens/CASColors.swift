import SwiftUI

/// 02_COLORS.md's palette, transcribed directly — the single source of
/// truth for CAS's fixed dark theme. No duplication in Assets.xcassets:
/// "the Design System belongs to the product, not to Xcode."
///
/// These are raw primitives only. Semantic meaning (which color means
/// "card background," which means "primary action") is assigned one
/// layer up, in `CASTheme`.
enum CASColors {
    // MARK: - Neutrals — background hierarchy (Level 0-3)

    /// Level 0 — application background.
    static let graphiteBlack = Color(hex: 0x141414)
    /// Level 1 — sections, panels.
    static let charcoal = Color(hex: 0x1E1E1E)
    /// Level 2 — cards, containers, elevated surfaces.
    static let steelGray = Color(hex: 0x2B2B2B)
    /// Level 3 — selected cards.
    static let selectedSteelGray = Color(hex: 0x343434)
    /// Borders, separators, inactive controls.
    static let borderGray = Color(hex: 0x3A3A3A)

    // MARK: - Typography colors

    static let primaryText = Color(hex: 0xF5F5F5)
    static let secondaryText = Color(hex: 0xA8A8A8)
    static let disabledText = Color(hex: 0x6F6F6F)

    // MARK: - Accents

    /// Performance Orange — primary actions, current exercise, today's
    /// recommendation, session progress. Used sparingly by design.
    static let performanceOrange = Color(hex: 0xF57C00)
    /// Recovery Green — recovery, successful completion, readiness.
    static let recoveryGreen = Color(hex: 0x4CAF50)
    /// Warning Amber — attention required, incomplete information.
    static let warningAmber = Color(hex: 0xFFB300)
    /// Critical Red — errors, failures, danger. Critical alerts only.
    static let criticalRed = Color(hex: 0xD32F2F)
}

private extension Color {
    /// `0xRRGGBB`, fully opaque — the only color construction CAS's
    /// token layer needs, since the palette is a fixed set of solid
    /// colors with no alpha variants.
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

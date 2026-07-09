import SwiftUI

/// 30-product/DESIGN_SYSTEM.md: "Color communicates meaning. Never
/// decoration." Only the semantic brand colors (primary, secondary,
/// warning, danger) are custom — each ships light/dark variants in
/// Assets.xcassets. Neutrals lean on Apple's own system semantic colors:
/// the doc explicitly wants CAS to feel "closer to Apple Health than to a
/// bodybuilding app," and those colors already handle Dark Mode, contrast
/// and accessibility correctly on their own.
enum CASTheme {
    enum Colors {
        static let primary = Color("CASPrimary")
        static let secondary = Color("CASSecondary")
        static let warning = Color("CASWarning")
        static let danger = Color("CASDanger")

        static let background = Color(uiColor: .systemBackground)
        static let secondaryBackground = Color(uiColor: .secondarySystemBackground)
        static let separator = Color(uiColor: .separator)
        static let primaryText = Color.primary
        static let secondaryText = Color.secondary
    }

    enum Metrics {
        static let cardCornerRadius: CGFloat = 16
        static let controlCornerRadius: CGFloat = 14
        static let cardPadding: CGFloat = 16
    }
}

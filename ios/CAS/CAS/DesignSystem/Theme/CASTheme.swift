import SwiftUI

/// Assembles the raw `DesignTokens/*` primitives into the semantic
/// surface `Components/` and `Features/` actually consume.
/// `01_DESIGN_SYSTEM.md`: "Color communicates information. Never
/// decoration." CAS now runs a single fixed dark theme (see
/// `CASApp.swift`'s `.preferredColorScheme(.dark)`), so every color
/// below is a fixed value from `CASColors` — no more light/dark
/// adaptive system colors.
enum CASTheme {
    enum Colors {
        // MARK: Background hierarchy (02_COLORS.md)

        /// Level 0 — application background.
        static let background = CASColors.graphiteBlack
        /// Level 1 — sections, panels.
        static let sectionBackground = CASColors.charcoal
        /// Level 2 — cards, containers, elevated surfaces.
        static let cardBackground = CASColors.steelGray
        /// Level 3 — selected cards.
        static let selectedCardBackground = CASColors.selectedSteelGray
        /// Borders, separators, inactive controls.
        static let border = CASColors.borderGray

        // MARK: Typography

        static let primaryText = CASColors.primaryText
        static let secondaryText = CASColors.secondaryText
        static let disabledText = CASColors.disabledText

        // MARK: Accents

        /// Performance Orange — primary actions, current exercise,
        /// today's recommendation.
        static let primary = CASColors.performanceOrange
        /// Recovery Green — recovery, success, readiness.
        static let secondary = CASColors.recoveryGreen
        static let warning = CASColors.warningAmber
        /// Critical Red — errors, failures. Critical alerts only.
        static let danger = CASColors.criticalRed

        // MARK: Deprecated aliases

        /// Deprecated — kept only so existing `Components/`/`Features/`
        /// call sites compile unchanged this step. Today's actual usage
        /// is always a card fill, so this now resolves to
        /// `cardBackground` (Level 2) instead of the old system-
        /// adaptive color. Step 2 migrates every call site to
        /// `cardBackground` directly, after which this alias is removed.
        static let secondaryBackground = cardBackground
        /// Deprecated — same reasoning as `secondaryBackground`.
        /// Migrates to `border` in Step 2.
        static let separator = border
    }

    enum Metrics {
        static let cardCornerRadius = CASRadius.card
        static let controlCornerRadius = CASRadius.control
        /// Sourced from `CASComponentMetrics`, not `CASSpacing` — see
        /// that file's doc comment for why a card's 20 px padding is a
        /// semantic override, not a primitive scale step.
        static let cardPadding = CASComponentMetrics.cardPadding
    }
}

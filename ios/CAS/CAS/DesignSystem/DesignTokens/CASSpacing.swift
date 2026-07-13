import Foundation

/// 04_SPACING.md's primitive 4-point spacing scale — "every spacing
/// value is a multiple of 4." These are raw building blocks only: a
/// component-specific override (e.g. card padding) is a *semantic*
/// token in `CASComponentMetrics`, never a new case added here.
enum CASSpacing {
    /// 4 px — very small gaps, icons and labels.
    static let xxs: CGFloat = 4
    /// 8 px — related elements, small vertical spacing.
    static let xs: CGFloat = 8
    /// 12 px — compact groups, form elements.
    static let s: CGFloat = 12
    /// 16 px — default spacing, most layouts, cards, lists, buttons.
    static let m: CGFloat = 16
    /// 24 px — section spacing, large groups.
    static let l: CGFloat = 24
    /// 32 px — major separation between independent sections.
    static let xl: CGFloat = 32
    /// 48 px — screen-level spacing, major visual breaks.
    static let xxl: CGFloat = 48

    /// 04_SPACING.md "Touch Targets": minimum tappable area — training
    /// often happens with sweaty hands.
    static let minimumTouchTarget: CGFloat = 44
    /// Preferred tappable area.
    static let preferredTouchTarget: CGFloat = 48
}

import Foundation

/// Corner radius primitives. Neither `01_DESIGN_SYSTEM.md` nor
/// `08_UI_KIT.md` prescribes exact radius numbers, so these preserve
/// the values already validated in the app today — only their location
/// changes, not their value.
enum CASRadius {
    /// Buttons, form controls, small containers.
    static let control: CGFloat = 14
    /// Cards.
    static let card: CGFloat = 16
}

import Foundation

/// 06_ICONOGRAPHY.md's icon size scale.
///
/// Lucide is CAS's official icon library at the product level — a
/// deliberate decision independent of any one platform's rendering
/// technology: "the Design System belongs to the product, not to
/// SwiftUI." Today's iOS implementation still draws icons with SF
/// Symbols for technical reasons (two SF Symbols total, in
/// `Features/Home/HomeView.swift`), and that stays true regardless of
/// this token file — these are pure size values, independent of
/// whichever technology ends up drawing the icon.
enum CASIcons {
    /// 16 px — supporting information.
    static let small: CGFloat = 16
    /// 20 px — lists, buttons, cards.
    static let standard: CGFloat = 20
    /// 24 px — navigation, section headers.
    static let medium: CGFloat = 24
    /// 32 px — major status indicators, empty states. Avoid icons
    /// larger than this during normal navigation.
    static let large: CGFloat = 32
}

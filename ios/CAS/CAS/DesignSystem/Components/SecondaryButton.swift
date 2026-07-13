import SwiftUI

/// 05_COMPONENTS.md "Secondary Button: Alternative actions... should
/// never compete visually with the Primary Button." Natural width and
/// an outline instead of a filled background — unlike `PrimaryButton`,
/// which is always full-width and filled with `CASTheme.Colors.primary`.
struct SecondaryButton: View {
    let title: String
    var action: () -> Void

    private var typeScale = CASTypeScale()

    /// Explicit, not the synthesized memberwise init: a `private`
    /// stored property (`typeScale`) would otherwise make the
    /// compiler-generated initializer `private` too, even though
    /// `typeScale` has a default value and isn't part of this
    /// signature.
    init(title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(typeScale.body.weight(.medium))
                .padding(.vertical, CASSpacing.m)
                .padding(.horizontal, CASSpacing.l)
        }
        .foregroundStyle(CASTheme.Colors.primaryText)
        .background(
            RoundedRectangle(cornerRadius: CASTheme.Metrics.controlCornerRadius, style: .continuous)
                .stroke(CASTheme.Colors.border, lineWidth: 1)
        )
        .buttonStyle(.plain)
        .frame(minHeight: CASSpacing.minimumTouchTarget)
    }
}

#Preview {
    SecondaryButton(title: "Modifier mon profil") {}
        .padding()
}

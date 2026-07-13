import SwiftUI

/// 05_COMPONENTS.md "Text Button: Low-priority actions... use
/// sparingly." No background, no border — the most discreet of the
/// three button variants.
struct TextButton: View {
    let title: String
    var action: () -> Void

    private var typeScale = CASTypeScale()

    /// Explicit, not the synthesized memberwise init — see
    /// `SecondaryButton`'s identical `init` for why.
    init(title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(typeScale.body.weight(.medium))
                .foregroundStyle(CASTheme.Colors.secondaryText)
                .padding(.vertical, CASSpacing.s)
                .padding(.horizontal, CASSpacing.xs)
        }
        .buttonStyle(.plain)
        .frame(minHeight: CASSpacing.minimumTouchTarget)
    }
}

#Preview {
    TextButton(title: "Annuler") {}
        .padding()
}

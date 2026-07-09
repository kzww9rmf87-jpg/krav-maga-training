import SwiftUI

/// The one obvious action per screen — 30-product/DESIGN_SYSTEM.md:
/// "every component should have a single obvious purpose."
struct PrimaryButton: View {
    let title: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(CASTypography.body.weight(.semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
        }
        .foregroundStyle(.white)
        .background(CASTheme.Colors.primary, in: RoundedRectangle(cornerRadius: CASTheme.Metrics.controlCornerRadius, style: .continuous))
        .buttonStyle(.plain)
    }
}

#Preview {
    PrimaryButton(title: "Commencer la séance") {}
        .padding()
}

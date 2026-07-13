import SwiftUI

/// One session, shown either as Home's single recommendation or in the
/// "Toutes les séances" list. Stays deliberately plain (title, subtitle)
/// rather than trying to look like a dashboard — UX.md. Composes `Card`
/// rather than re-implementing padding/fill/corner-radius by hand.
struct SessionCard: View {
    let title: String
    let subtitle: String

    private var typeScale = CASTypeScale()

    /// Explicit, not the synthesized memberwise init — see
    /// `PrimaryButton`'s identical `init` for why a `private` stored
    /// property (`typeScale`) requires this.
    init(title: String, subtitle: String) {
        self.title = title
        self.subtitle = subtitle
    }

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: CASSpacing.xxs) {
                Text(title)
                    .font(typeScale.heading2)
                    .foregroundStyle(CASTheme.Colors.primaryText)
                Text(subtitle)
                    .font(typeScale.caption)
                    .foregroundStyle(CASTheme.Colors.secondaryText)
            }
        }
    }
}

#Preview {
    SessionCard(title: "Séance A — Force maximale", subtitle: "Demi-pyramide montante")
        .padding()
}

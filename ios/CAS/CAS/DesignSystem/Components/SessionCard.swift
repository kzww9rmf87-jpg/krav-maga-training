import SwiftUI

/// One session, shown either as Home's single recommendation or in the
/// "Toutes les séances" list. Stays deliberately plain (title, subtitle)
/// rather than trying to look like a dashboard — UX.md.
struct SessionCard: View {
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(CASTypography.sectionTitle)
                .foregroundStyle(CASTheme.Colors.primaryText)
            Text(subtitle)
                .font(CASTypography.caption)
                .foregroundStyle(CASTheme.Colors.secondaryText)
        }
        .padding(CASTheme.Metrics.cardPadding)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(CASTheme.Colors.secondaryBackground, in: RoundedRectangle(cornerRadius: CASTheme.Metrics.cardCornerRadius, style: .continuous))
    }
}

#Preview {
    SessionCard(title: "Séance A — Force maximale", subtitle: "Demi-pyramide montante")
        .padding()
}

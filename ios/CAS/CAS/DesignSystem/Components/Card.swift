import SwiftUI

/// The generic card recipe every card-shaped surface in CAS should
/// share — 05_COMPONENTS.md: "Cards group related information...
/// consistent padding, consistent spacing, consistent hierarchy."
/// `SessionCard` composes this rather than re-implementing the same
/// padding/fill/corner-radius recipe by hand.
struct Card<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(CASComponentMetrics.cardPadding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(CASTheme.Colors.cardBackground, in: RoundedRectangle(cornerRadius: CASTheme.Metrics.cardCornerRadius, style: .continuous))
    }
}

#Preview {
    Card {
        Text("Card content")
    }
    .padding()
}

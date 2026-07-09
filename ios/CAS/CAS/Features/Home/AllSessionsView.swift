import SwiftUI

/// The secondary "toutes les séances" access explicitly requested for
/// Sprint 2 — Home itself shows a single recommendation, not a list, per
/// UX.md ("one screen, one decision, one action"). This is where the old
/// flat list lives now, reached deliberately rather than shown by
/// default.
struct AllSessionsView: View {
    let sessions: [TrainingSession]
    var onSelect: (TrainingSession) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(sessions) { session in
                        Button {
                            onSelect(session)
                        } label: {
                            SessionCard(title: session.title, subtitle: session.subtitle)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
            .background(CASTheme.Colors.background)
            .navigationTitle("Toutes les séances")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fermer") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    AllSessionsView(sessions: SeedSessions.all) { _ in }
}

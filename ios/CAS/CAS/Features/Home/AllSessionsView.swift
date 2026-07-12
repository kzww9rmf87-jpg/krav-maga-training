import SwiftUI

/// The secondary "toutes les séances" access explicitly requested for
/// Sprint 2 — Home itself shows a single recommendation, not a list, per
/// UX.md ("one screen, one decision, one action"). This is where the old
/// flat list lives now, reached deliberately rather than shown by
/// default.
///
/// Beta 1.0: always renders all five sessions, whatever their
/// `SessionAvailability` — an unavailable one stays visible with its
/// reasons, never silently dropped from the list.
struct AllSessionsView: View {
    let items: [(session: TrainingSession, availability: SessionAvailability)]
    var onSelect: (ResolvedTrainingSession) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(items, id: \.session.id) { item in
                        row(for: item)
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

    @ViewBuilder
    private func row(for item: (session: TrainingSession, availability: SessionAvailability)) -> some View {
        switch item.availability {
        case .available(let resolved):
            Button {
                onSelect(resolved)
            } label: {
                SessionCard(title: resolved.session.title, subtitle: resolved.session.subtitle)
            }
            .buttonStyle(.plain)

        case .availableWithCompromises(let resolved):
            Button {
                onSelect(resolved)
            } label: {
                VStack(alignment: .leading, spacing: 6) {
                    SessionCard(title: resolved.session.title, subtitle: resolved.session.subtitle)
                    Text("Séance adaptée à votre équipement")
                        .font(CASTypography.caption.weight(.medium))
                        .foregroundStyle(CASTheme.Colors.warning)
                }
            }
            .buttonStyle(.plain)

        case .unavailable(let reasons):
            VStack(alignment: .leading, spacing: 6) {
                Text(item.session.title)
                    .font(CASTypography.body.weight(.semibold))
                    .foregroundStyle(CASTheme.Colors.secondaryText)
                ForEach(reasons, id: \.self) { reason in
                    Text(reason)
                        .font(CASTypography.caption)
                        .foregroundStyle(CASTheme.Colors.secondaryText)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(CASTheme.Colors.secondaryBackground, in: RoundedRectangle(cornerRadius: CASTheme.Metrics.controlCornerRadius, style: .continuous))
        }
    }
}

#Preview {
    AllSessionsView(
        items: SeedSessions.primary.map { session in
            (session, SessionAvailabilityResolver.evaluate(session, availableEquipment: []))
        },
        onSelect: { _ in }
    )
}

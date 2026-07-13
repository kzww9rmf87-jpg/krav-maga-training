import SwiftData
import SwiftUI

/// Read-only history — DESIGN_SYSTEM.md: "statistics exist to support
/// decisions, not curiosity." No graphs here yet; a list of what actually
/// happened is the whole feature until there's enough volume, and a real
/// question, to justify a chart.
struct HistoryView: View {
    @Query(sort: \SessionLog.date, order: .reverse) private var logs: [SessionLog]

    var body: some View {
        NavigationStack {
            Group {
                if logs.isEmpty {
                    ContentUnavailableView(
                        "Aucune séance enregistrée",
                        systemImage: "clock.arrow.circlepath",
                        description: Text("L'historique de tes séances apparaîtra ici.")
                    )
                } else {
                    List(logs) { log in
                        NavigationLink {
                            SessionLogDetailView(log: log)
                        } label: {
                            HistoryRow(log: log)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Historique")
        }
    }
}

private struct HistoryRow: View {
    let log: SessionLog

    private var typeScale = CASTypeScale()

    /// Explicit, not the synthesized memberwise init: a `private`
    /// stored property (`typeScale`) would otherwise make the
    /// compiler-generated initializer inaccessible from `HistoryView.body`.
    init(log: SessionLog) {
        self.log = log
    }

    var body: some View {
        VStack(alignment: .leading, spacing: CASSpacing.xxs) {
            Text(log.sessionTitle)
                .font(typeScale.body.weight(.semibold))
                .foregroundStyle(CASTheme.Colors.primaryText)
            Text(log.date.formatted(date: .abbreviated, time: .shortened))
                .font(typeScale.caption)
                .foregroundStyle(CASTheme.Colors.secondaryText)
        }
        .padding(.vertical, CASSpacing.xxs)
    }
}

#Preview {
    HistoryView()
        .modelContainer(PersistenceController.makeContainer(inMemory: true))
}

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

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(log.sessionTitle)
                .font(CASTypography.body.weight(.semibold))
                .foregroundStyle(CASTheme.Colors.primaryText)
            Text(log.date.formatted(date: .abbreviated, time: .shortened))
                .font(CASTypography.caption)
                .foregroundStyle(CASTheme.Colors.secondaryText)
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    HistoryView()
        .modelContainer(PersistenceController.makeContainer(inMemory: true))
}

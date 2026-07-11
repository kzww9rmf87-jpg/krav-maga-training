import SwiftUI

/// Alpha 1.1, item 1: shown before execution starts, so the athlete sees
/// the whole session — exercises, volume, duration — before committing to
/// it. Read-only; "Commencer" is the only action, matching UX.md's "one
/// screen, one decision, one action."
struct SessionOverviewView: View {
    let session: TrainingSession
    var onStart: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(session.title)
                            .font(CASTypography.sessionTitle)
                            .foregroundStyle(CASTheme.Colors.primaryText)
                        Text(session.subtitle)
                            .font(CASTypography.caption)
                            .foregroundStyle(CASTheme.Colors.secondaryText)
                    }

                    statsRow

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Exercices")
                            .font(CASTypography.sectionTitle)
                            .foregroundStyle(CASTheme.Colors.primaryText)
                        ForEach(session.exerciseOverviews) { overview in
                            HStack {
                                Text(overview.exerciseName)
                                    .font(CASTypography.body)
                                    .foregroundStyle(CASTheme.Colors.primaryText)
                                Spacer()
                                if overview.setCount > 0 {
                                    Text("\(overview.setCount) séries")
                                        .font(CASTypography.caption)
                                        .foregroundStyle(CASTheme.Colors.secondaryText)
                                }
                            }
                        }
                    }

                    Spacer(minLength: 12)

                    PrimaryButton(title: "Commencer", action: onStart)
                }
                .padding()
            }
            .background(CASTheme.Colors.background)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Fermer") { dismiss() }
                }
            }
        }
    }

    private var statsRow: some View {
        HStack(spacing: 20) {
            statItem(value: "\(session.exerciseCount)", label: "exercices")
            statItem(value: "\(session.setCount)", label: "séries")
            statItem(value: Self.formattedDuration(session.estimatedDurationMinutes), label: "durée")
            if let volumeKg = session.estimatedVolumeKg {
                statItem(value: "\(Int(volumeKg.rounded())) kg", label: "volume")
            }
        }
    }

    private func statItem(value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value)
                .font(CASTypography.body.weight(.semibold))
                .foregroundStyle(CASTheme.Colors.primaryText)
            Text(label)
                .font(CASTypography.caption)
                .foregroundStyle(CASTheme.Colors.secondaryText)
        }
    }

    /// "25 min" under an hour, "1 h 40" at or above one hour. Same
    /// convention as `HomeView.formattedDuration`, without the "≈" prefix
    /// since this screen already frames every number as an estimate.
    private static func formattedDuration(_ minutes: Int) -> String {
        guard minutes >= 60 else { return "\(minutes) min" }
        let hours = minutes / 60
        let remainder = minutes % 60
        return remainder == 0 ? "\(hours) h" : "\(hours) h \(remainder)"
    }
}

#Preview {
    SessionOverviewView(session: CASForce.session, onStart: {})
}

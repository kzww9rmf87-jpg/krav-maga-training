import SwiftUI

/// Alpha 1.1, item 1: shown before execution starts, so the athlete sees
/// the whole session — exercises, volume, duration — before committing to
/// it. Read-only; "Commencer" is the only action, matching UX.md's "one
/// screen, one decision, one action."
///
/// Beta 1.0: `resolved` may already have equipment substitutions applied
/// — the "Exercices" section below needs no change for that (it already
/// reads whatever `session` actually contains), but a compromise always
/// gets its own explicit section, never silently folded into the regular
/// exercise list.
struct SessionOverviewView: View {
    let originalSession: TrainingSession
    let resolved: ResolvedTrainingSession
    var onStart: () -> Void

    @Environment(\.dismiss) private var dismiss

    private var session: TrainingSession { resolved.session }

    /// Only `.partial` substitutions are surfaced here — a `.strong` one
    /// is traced in `resolved.substitutions` for anyone who needs to
    /// explain it, but never flagged as a compromise on this screen.
    private var partialSubstitutions: [AppliedSubstitution] {
        resolved.substitutions.filter { $0.equivalence == .partial }
    }

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

                    if !partialSubstitutions.isEmpty {
                        adaptationsSection
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

    private var adaptationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Adaptations pour votre équipement")
                .font(CASTypography.sectionTitle)
                .foregroundStyle(CASTheme.Colors.primaryText)
            ForEach(partialSubstitutions, id: \.originalExerciseID) { substitution in
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(originalExerciseName(substitution.originalExerciseID)) → \(replacementExerciseName(substitution.replacementExerciseID))")
                        .font(CASTypography.body.weight(.semibold))
                        .foregroundStyle(CASTheme.Colors.primaryText)
                    Text(substitution.note)
                        .font(CASTypography.caption)
                        .foregroundStyle(CASTheme.Colors.secondaryText)
                }
            }
        }
    }

    /// Original exercise names come from `originalSession` (never
    /// substituted) — `resolved.session` no longer contains them once a
    /// substitution has been applied.
    private func originalExerciseName(_ exerciseId: String) -> String {
        Self.exerciseName(forId: exerciseId, in: originalSession) ?? exerciseId
    }

    /// Replacement names come from `resolved.session`, which does
    /// contain them.
    private func replacementExerciseName(_ exerciseId: String) -> String {
        Self.exerciseName(forId: exerciseId, in: resolved.session) ?? exerciseId
    }

    private static func exerciseName(forId exerciseId: String, in session: TrainingSession) -> String? {
        guard case .standard(let modules) = session.format else { return nil }
        for module in modules {
            if let match = module.exercises.first(where: { $0.exercise.id == exerciseId }) {
                return match.exercise.name
            }
        }
        return nil
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
    SessionOverviewView(
        originalSession: CASForce.session,
        resolved: ResolvedTrainingSession(session: CASForce.session, substitutions: []),
        onStart: {}
    )
}

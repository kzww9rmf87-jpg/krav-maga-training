import SwiftData
import SwiftUI

/// UX.md "Training Screen": only the current exercise is visible, the next
/// stays hidden. No navigation chrome — this is a full-screen cover, not a
/// pushed screen, so there's no back button competing for attention.
struct SessionExecutionView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: SessionExecutionViewModel
    @State private var summaryPayload: SummaryPayload?

    /// Bundles the completed logs into the value that drives sheet
    /// presentation itself, instead of a separate `Bool` + `[SetLog]` pair —
    /// two independent `@State` writes race against `.sheet(isPresented:)`,
    /// which can build its content closure before the second write
    /// propagates. `.sheet(item:)` can't observe a half-updated state.
    private struct SummaryPayload: Identifiable {
        let id = UUID()
        let logs: [SetLog]
    }

    init(session: TrainingSession) {
        _viewModel = State(initialValue: SessionExecutionViewModel(session: session))
    }

    /// Alpha 1.1, item 4. Built fresh per read, same as `HomeView`'s
    /// `@Query` pattern — cheap, and always reflects the latest saves.
    private var historyStore: SessionHistoryStore {
        SwiftDataSessionHistoryStore(context: modelContext)
    }

    var body: some View {
        Group {
            if viewModel.isResting {
                RestTimerView(timer: viewModel.restTimer, nextStep: viewModel.nextStep, onSkip: viewModel.finishResting)
            } else if let step = viewModel.currentStep {
                stepView(for: step)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(CASTheme.Colors.background)
        .safeAreaInset(edge: .top) {
            VStack(spacing: 8) {
                HStack {
                    Button("Quitter") { dismiss() }
                        .foregroundStyle(CASTheme.Colors.secondaryText)
                    Spacer()
                    Text(viewModel.progressText)
                        .font(CASTypography.caption)
                        .foregroundStyle(CASTheme.Colors.secondaryText)
                }
                ProgressView(value: viewModel.progressFraction)
                    .tint(CASTheme.Colors.primary)
                    .animation(.easeInOut, value: viewModel.progressFraction)
            }
            .padding()
        }
        .onAppear {
            viewModel.onFinish = { logs in
                summaryPayload = SummaryPayload(logs: logs)
            }
        }
        .sheet(item: $summaryPayload) { payload in
            SessionSummaryView(
                viewModel: SessionSummaryViewModel(
                    session: viewModel.session,
                    setLogs: payload.logs,
                    historyStore: SwiftDataSessionHistoryStore(context: modelContext)
                ),
                onDone: { dismiss() }
            )
            .interactiveDismissDisabled()
        }
    }

    @ViewBuilder
    private func stepView(for step: ExecutionStep) -> some View {
        VStack(alignment: .leading, spacing: 20) {
            Tag(kind: step.groupKind)

            Text(step.exerciseName)
                .font(CASTypography.sessionTitle)
                .foregroundStyle(CASTheme.Colors.primaryText)

            if let label = step.label {
                Text(label)
                    .font(CASTypography.caption)
                    .foregroundStyle(CASTheme.Colors.secondaryText)
            }

            switch step.instruction {
            case .setRow(let load, let reps):
                SetRow(
                    label: nil,
                    load: Binding(
                        get: { viewModel.setLogs[viewModel.currentIndex]?.actualLoadValue ?? load },
                        set: { viewModel.updateCurrentLoad($0) }
                    ),
                    reps: Binding(
                        get: { viewModel.setLogs[viewModel.currentIndex]?.actualReps ?? reps },
                        set: { viewModel.updateCurrentReps($0) }
                    )
                )
                if let lastSets = historyStore.lastPerformance(ofExerciseNamed: step.exerciseName) {
                    exerciseHistory(lastSets: lastSets, best: historyStore.bestPerformance(ofExerciseNamed: step.exerciseName))
                }
            case .freeText(let text):
                Text(text)
                    .font(CASTypography.body)
                    .foregroundStyle(CASTheme.Colors.primaryText)
            }

            if let note = step.coachNote {
                Text(note)
                    .font(CASTypography.caption)
                    .foregroundStyle(CASTheme.Colors.secondaryText)
            }

            Spacer()

            PrimaryButton(
                title: viewModel.isLastStep ? "Terminer la séance" : "Valider",
                action: viewModel.advance
            )
        }
        .padding()
    }

    /// Alpha 1.1, item 4. Textual regardless of `LoadValue` kind —
    /// qualitative and custom loads show exactly as prescribed/logged,
    /// never reinterpreted. "Record" only appears when a reliable number
    /// exists (`bestPerformance` returns nil otherwise).
    @ViewBuilder
    private func exerciseHistory(lastSets: [SetLog], best: SetLog?) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Dernière séance")
                .font(CASTypography.caption)
                .foregroundStyle(CASTheme.Colors.secondaryText)
            Text(Self.historyLine(for: lastSets))
                .font(CASTypography.caption.weight(.medium))
                .foregroundStyle(CASTheme.Colors.primaryText)
            if let best {
                Text("Record : \(best.actualLoadValue.displayText) × \(best.actualReps)")
                    .font(CASTypography.caption)
                    .foregroundStyle(CASTheme.Colors.secondaryText)
            }
        }
    }

    private static func historyLine(for sets: [SetLog]) -> String {
        let distinctLoads = Set(sets.map(\.actualLoadValue))
        if distinctLoads.count == 1, let load = distinctLoads.first {
            return "\(load.displayText) — " + sets.map(\.actualReps).joined(separator: " / ")
        }
        return sets.map { "\($0.actualLoadValue.displayText) × \($0.actualReps)" }.joined(separator: " · ")
    }
}

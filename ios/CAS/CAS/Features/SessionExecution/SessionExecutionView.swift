import SwiftData
import SwiftUI

/// UX.md "Training Screen": only the current exercise is visible, the next
/// stays hidden. No navigation chrome — this is a full-screen cover, not a
/// pushed screen, so there's no back button competing for attention.
struct SessionExecutionView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: SessionExecutionViewModel
    @State private var showSummary = false
    @State private var completedLogs: [SetLog] = []

    init(session: TrainingSession) {
        _viewModel = State(initialValue: SessionExecutionViewModel(session: session))
    }

    var body: some View {
        Group {
            if viewModel.isResting {
                RestTimerView(timer: viewModel.restTimer, onSkip: viewModel.finishResting)
            } else if let step = viewModel.currentStep {
                stepView(for: step)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(CASTheme.Colors.background)
        .safeAreaInset(edge: .top) {
            HStack {
                Button("Quitter") { dismiss() }
                    .foregroundStyle(CASTheme.Colors.secondaryText)
                Spacer()
                Text(viewModel.progressText)
                    .font(CASTypography.caption)
                    .foregroundStyle(CASTheme.Colors.secondaryText)
            }
            .padding()
        }
        .onAppear {
            viewModel.onFinish = { logs in
                completedLogs = logs
                showSummary = true
            }
        }
        .sheet(isPresented: $showSummary) {
            SessionSummaryView(
                viewModel: SessionSummaryViewModel(
                    session: viewModel.session,
                    setLogs: completedLogs,
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
                        get: { viewModel.setLogs[viewModel.currentIndex]?.actualLoad ?? load },
                        set: { viewModel.updateCurrentLoad($0) }
                    ),
                    reps: Binding(
                        get: { viewModel.setLogs[viewModel.currentIndex]?.actualReps ?? reps },
                        set: { viewModel.updateCurrentReps($0) }
                    )
                )
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
}

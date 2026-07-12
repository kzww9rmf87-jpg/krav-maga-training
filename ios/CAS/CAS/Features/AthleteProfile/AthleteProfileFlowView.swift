import SwiftUI

/// The 5-step flow, shared identically by onboarding and profile editing.
/// `onCancel == nil` is what makes onboarding mandatory: no toolbar button
/// to dismiss it, and interactive (swipe-down) dismissal is disabled to
/// match — the only way out is `finish()` succeeding, which calls
/// `onFinished`.
struct AthleteProfileFlowView: View {
    @Bindable var viewModel: AthleteProfileFlowViewModel
    var onFinished: (AthleteProfile) -> Void
    var onCancel: (() -> Void)?

    private static let stepTitles = [
        "Environnement",
        "Expérience",
        "Fréquence",
        "Objectif",
        "Contrainte physique",
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                stepContent
                navigationBar
            }
            .navigationTitle(Self.stepTitles[viewModel.stepIndex])
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                if let onCancel {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Annuler", action: onCancel)
                    }
                }
            }
            .alert(
                "Erreur",
                isPresented: Binding(
                    get: { viewModel.saveError != nil },
                    set: { if !$0 { viewModel.clearSaveError() } }
                )
            ) {
                Button("Réessayer") { attemptFinish() }
                Button("Fermer", role: .cancel) { viewModel.clearSaveError() }
            } message: {
                Text(viewModel.saveError ?? "")
            }
        }
        .interactiveDismissDisabled(onCancel == nil)
    }

    @ViewBuilder
    private var stepContent: some View {
        switch viewModel.stepIndex {
        case 0: EnvironmentEquipmentStepView(profile: $viewModel.draft)
        case 1: ExperienceStepView(profile: $viewModel.draft)
        case 2: FrequencyDurationStepView(profile: $viewModel.draft)
        case 3: GoalStepView(profile: $viewModel.draft)
        default: PhysicalConstraintStepView(profile: $viewModel.draft)
        }
    }

    private var navigationBar: some View {
        HStack {
            if !viewModel.isFirstStep {
                Button("Précédent") { viewModel.goBack() }
                    .foregroundStyle(CASTheme.Colors.secondaryText)
            }
            Spacer()
            PrimaryButton(title: finishButtonTitle) {
                if viewModel.isLastStep {
                    attemptFinish()
                } else {
                    viewModel.goNext()
                }
            }
            .frame(maxWidth: 160)
        }
        .padding()
    }

    private var finishButtonTitle: String {
        guard viewModel.isLastStep else { return "Suivant" }
        return viewModel.mode == .onboarding ? "Terminer" : "Enregistrer"
    }

    private func attemptFinish() {
        if viewModel.finish() {
            onFinished(viewModel.draft)
        }
    }
}

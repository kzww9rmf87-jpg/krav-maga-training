import SwiftUI

/// UX.md "During Rest": intentionally quiet — one large countdown, one way
/// out. Nothing else competes for attention. Alpha 1.1 adds a next-exercise
/// preview (item 3) so the athlete can set up equipment during rest, but it
/// stays a small, secondary block below the countdown — never competing
/// with it.
struct RestTimerView: View {
    let timer: RestTimerService
    let nextStep: ExecutionStep?
    var onSkip: () -> Void

    @Environment(\.scenePhase) private var scenePhase

    private var formattedTime: String {
        let minutes = timer.remainingSeconds / 60
        let seconds = timer.remainingSeconds % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    var body: some View {
        VStack(spacing: 24) {
            Text("Repos")
                .font(CASTypography.sectionTitle)
                .foregroundStyle(CASTheme.Colors.secondaryText)
            Text(formattedTime)
                .font(CASTypography.restTimer)
                .monospacedDigit()
                .foregroundStyle(CASTheme.Colors.primaryText)
            PrimaryButton(title: timer.isRunning ? "Passer" : "Continuer", action: onSkip)
                .frame(maxWidth: 220)

            if let nextStep {
                nextStepPreview(nextStep)
                    .padding(.top, 12)
            }
        }
        // The internal display loop only runs while this view is alive
        // and the app is active — coming back from locked/backgrounded
        // needs an explicit re-sync against the wall clock rather than
        // trusting whatever `remainingSeconds` was left showing.
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .active {
                timer.refresh()
            }
        }
    }

    @ViewBuilder
    private func nextStepPreview(_ step: ExecutionStep) -> some View {
        VStack(spacing: 4) {
            Text("Ensuite")
                .font(CASTypography.caption)
                .foregroundStyle(CASTheme.Colors.secondaryText)
            Text(step.exerciseName)
                .font(CASTypography.body.weight(.semibold))
                .foregroundStyle(CASTheme.Colors.secondaryText)
            switch step.instruction {
            case .setRow(let load, let reps):
                Text("\(load.displayText) × \(reps)")
                    .font(CASTypography.caption)
                    .foregroundStyle(CASTheme.Colors.secondaryText)
            case .freeText:
                EmptyView()
            }
        }
    }
}

#Preview {
    RestTimerView(timer: RestTimerService(), nextStep: nil, onSkip: {})
}

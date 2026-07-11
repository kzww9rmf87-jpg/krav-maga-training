import SwiftUI

/// UX.md "During Rest": intentionally quiet — one large countdown, one way
/// out. Nothing else competes for attention.
struct RestTimerView: View {
    let timer: RestTimerService
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
}

#Preview {
    RestTimerView(timer: RestTimerService(), onSkip: {})
}

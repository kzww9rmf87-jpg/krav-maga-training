import SwiftUI

/// The full session flow, presented as one `.fullScreenCover`: overview
/// first (Alpha 1.1, item 1), then execution once the athlete confirms.
/// Keeps `SessionExecutionView`/`SessionExecutionViewModel` completely
/// untouched — this only decides which of the two to show.
///
/// Beta 1.0: `resolved` is already the fully-resolved session (equipment
/// substitutions, if any, already applied by `HomeViewModel`) — nothing
/// here re-resolves it. `originalSession` is only ever used to look up
/// original exercise names for `SessionOverviewView`'s compromise
/// section; execution always runs `resolved.session`.
struct SessionFlowContainer: View {
    let originalSession: TrainingSession
    let resolved: ResolvedTrainingSession

    @State private var hasStarted = false

    var body: some View {
        if hasStarted {
            SessionExecutionView(session: resolved.session)
        } else {
            SessionOverviewView(originalSession: originalSession, resolved: resolved, onStart: { hasStarted = true })
        }
    }
}

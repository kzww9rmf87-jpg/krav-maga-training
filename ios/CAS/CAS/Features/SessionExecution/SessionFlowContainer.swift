import SwiftUI

/// The full session flow, presented as one `.fullScreenCover`: overview
/// first (Alpha 1.1, item 1), then execution once the athlete confirms.
/// Keeps `SessionExecutionView`/`SessionExecutionViewModel` completely
/// untouched — this only decides which of the two to show.
struct SessionFlowContainer: View {
    let session: TrainingSession

    @State private var hasStarted = false

    var body: some View {
        if hasStarted {
            SessionExecutionView(session: session)
        } else {
            SessionOverviewView(session: session, onStart: { hasStarted = true })
        }
    }
}

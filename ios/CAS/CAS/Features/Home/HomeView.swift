import SwiftUI

struct HomeView: View {
    @State private var viewModel = HomeViewModel()
    @State private var selectedSession: TrainingSession?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    ForEach(viewModel.sessions) { session in
                        Button {
                            selectedSession = session
                        } label: {
                            SessionCard(title: session.title, subtitle: session.subtitle)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
            .background(CASTheme.Colors.background)
            .navigationTitle("CAS")
            .fullScreenCover(item: $selectedSession) { session in
                SessionExecutionView(session: session)
            }
        }
    }
}

#Preview {
    HomeView()
}

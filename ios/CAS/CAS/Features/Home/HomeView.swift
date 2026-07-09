import SwiftUI

struct HomeView: View {
    @State private var viewModel = HomeViewModel()
    @State private var selectedSession: TrainingSession?
    @State private var showHistory = false

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
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showHistory = true
                    } label: {
                        Image(systemName: "clock.arrow.circlepath")
                    }
                    .accessibilityLabel("Historique")
                }
            }
            .fullScreenCover(item: $selectedSession) { session in
                SessionExecutionView(session: session)
            }
            .sheet(isPresented: $showHistory) {
                HistoryView()
            }
        }
    }
}

#Preview {
    HomeView()
}

import SwiftData
import SwiftUI

/// UX.md "Home Screen": answers "what should I do today?" and "why
/// today?" with one card and one action — not a list. "Toutes les
/// séances" is the deliberate escape hatch (a `.sheet`, not the Home
/// screen itself) for picking something else.
struct HomeView: View {
    @State private var viewModel = HomeViewModel()
    @State private var selectedSession: TrainingSession?
    @State private var showHistory = false
    @State private var showAllSessions = false
    @Query(sort: [SortDescriptor(\SessionLog.date, order: .reverse)]) private var recentLogs: [SessionLog]

    private var recommendation: SessionRecommendation? {
        viewModel.recommendation(afterLastCompletedSessionId: recentLogs.first?.sessionId)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let recommendation {
                        VStack(alignment: .leading, spacing: 12) {
                            SessionCard(title: recommendation.session.title, subtitle: recommendation.session.subtitle)

                            if !recommendation.session.primaryActionCapability.isEmpty {
                                // The Action Capability gets body-weight
                                // emphasis, not caption — see
                                // 10-science/03_ACTION_CAPABILITIES.md:
                                // "Action Capabilities constitute the
                                // true product of CAS." It's the "why,"
                                // modules and duration are supporting detail.
                                Text(recommendation.session.primaryActionCapability)
                                    .font(CASTypography.body.weight(.semibold))
                                    .foregroundStyle(CASTheme.Colors.primaryText)
                            }

                            if !recommendation.session.moduleNames.isEmpty {
                                Text(recommendation.session.moduleNames.joined(separator: " → "))
                                    .font(CASTypography.caption)
                                    .foregroundStyle(CASTheme.Colors.secondaryText)
                            }

                            Text(Self.formattedDuration(recommendation.session.estimatedDurationMinutes))
                                .font(CASTypography.caption)
                                .foregroundStyle(CASTheme.Colors.secondaryText)
                            Text(recommendation.reason)
                                .font(CASTypography.caption)
                                .foregroundStyle(CASTheme.Colors.secondaryText)
                            PrimaryButton(title: "Commencer") {
                                selectedSession = recommendation.session
                            }
                        }
                    }

                    Button("Toutes les séances") {
                        showAllSessions = true
                    }
                    .font(CASTypography.caption)
                    .foregroundStyle(CASTheme.Colors.secondaryText)
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
                SessionFlowContainer(session: session)
            }
            .sheet(isPresented: $showHistory) {
                HistoryView()
            }
            .sheet(isPresented: $showAllSessions) {
                AllSessionsView(sessions: viewModel.sessions) { session in
                    showAllSessions = false
                    selectedSession = session
                }
            }
        }
    }

    /// "≈ 25 min" under an hour, "≈ 1 h 40" at or above one hour.
    private static func formattedDuration(_ minutes: Int) -> String {
        guard minutes >= 60 else { return "≈ \(minutes) min" }
        let hours = minutes / 60
        let remainder = minutes % 60
        return remainder == 0 ? "≈ \(hours) h" : "≈ \(hours) h \(remainder)"
    }
}

#Preview {
    HomeView()
        .modelContainer(PersistenceController.makeContainer(inMemory: true))
}

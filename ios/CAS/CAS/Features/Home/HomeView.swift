import SwiftData
import SwiftUI

/// UX.md "Home Screen": answers "what should I do today?" and "why
/// today?" with one card and one action — not a list. "Toutes les
/// séances" is the deliberate escape hatch (a `.sheet`, not the Home
/// screen itself) for picking something else.
struct HomeView: View {
    @State private var viewModel = HomeViewModel()
    @State private var selectedResolved: ResolvedTrainingSession?
    @State private var showHistory = false
    @State private var showAllSessions = false
    @State private var isEditingProfile = false
    @Environment(\.modelContext) private var modelContext
    @Query(sort: [SortDescriptor(\SessionLog.date, order: .reverse)]) private var recentLogs: [SessionLog]

    /// `nil` while the profile isn't `.loaded` — see
    /// `AthleteProfileLoadState.equipmentForRecommendation`. A recommendation
    /// is only ever computed once the athlete's real equipment is known.
    private var recommendation: SessionRecommendation? {
        guard let equipment = viewModel.profileLoadState.equipmentForRecommendation else { return nil }
        return viewModel.recommendation(afterLastCompletedSessionId: recentLogs.first?.sessionId, availableEquipment: equipment)
    }

    /// The original (unsubstituted) session matching a resolved one, for
    /// `SessionOverviewView`'s "Adaptations" section — falls back to the
    /// resolved session itself in the unreachable case where the id isn't
    /// found among `viewModel.sessions`.
    private func originalSession(for resolved: ResolvedTrainingSession) -> TrainingSession {
        viewModel.sessions.first { $0.id == resolved.session.id } ?? resolved.session
    }

    /// Beta 1.0. Built fresh per read, same pattern as `SessionExecutionView`'s
    /// `historyStore` — cheap, and always talks to the current context.
    private var profileStore: AthleteProfileStore {
        SwiftDataAthleteProfileStore(context: modelContext)
    }

    /// Drives `.fullScreenCover(isPresented:)` for mandatory onboarding.
    /// The `set` closure is effectively unreachable in normal use: nothing
    /// on this screen offers to dismiss onboarding directly, only
    /// `AthleteProfileFlowView.onFinished` moves `profileLoadState` out of
    /// `.missing`, which is what actually closes the cover.
    private var isOnboardingPresented: Binding<Bool> {
        Binding(get: { viewModel.profileLoadState.isMissing }, set: { _ in })
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    profileStatusBanner

                    if case .loaded = viewModel.profileLoadState {
                        if let recommendation {
                            recommendationCard(recommendation)
                        } else {
                            noSessionAvailableCard
                        }
                    }

                    Button("Toutes les séances") {
                        showAllSessions = true
                    }
                    .font(CASTypography.caption)
                    .foregroundStyle(CASTheme.Colors.secondaryText)
                    .disabled(viewModel.profileLoadState.equipmentForRecommendation == nil)
                }
                .padding()
            }
            .background(CASTheme.Colors.background)
            .navigationTitle("CAS")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        isEditingProfile = true
                    } label: {
                        Image(systemName: "person.crop.circle")
                    }
                    .accessibilityLabel("Profil")
                    .disabled(viewModel.profileLoadState.editableProfile == nil)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showHistory = true
                    } label: {
                        Image(systemName: "clock.arrow.circlepath")
                    }
                    .accessibilityLabel("Historique")
                }
            }
            .task {
                viewModel.loadProfileIfNeeded(using: profileStore)
            }
            .fullScreenCover(item: $selectedResolved) { resolved in
                SessionFlowContainer(originalSession: originalSession(for: resolved), resolved: resolved)
            }
            .fullScreenCover(isPresented: isOnboardingPresented) {
                AthleteProfileFlowView(
                    viewModel: AthleteProfileFlowViewModel(mode: .onboarding, existingProfile: nil, store: profileStore),
                    onFinished: { profile in viewModel.profileSaved(profile) },
                    onCancel: nil
                )
            }
            .sheet(isPresented: $isEditingProfile) {
                if let editableProfile = viewModel.profileLoadState.editableProfile {
                    AthleteProfileFlowView(
                        viewModel: AthleteProfileFlowViewModel(mode: .edit, existingProfile: editableProfile, store: profileStore),
                        onFinished: { profile in
                            viewModel.profileSaved(profile)
                            isEditingProfile = false
                        },
                        onCancel: { isEditingProfile = false }
                    )
                }
            }
            .sheet(isPresented: $showHistory) {
                HistoryView()
            }
            .sheet(isPresented: $showAllSessions) {
                // Same discipline as the recommendation card: never
                // resolves against a fallback empty set — if the profile
                // genuinely isn't loaded, the button that gets here is
                // disabled in the first place (see the toolbar `Button`
                // below).
                if let equipment = viewModel.profileLoadState.equipmentForRecommendation {
                    AllSessionsView(items: viewModel.sessionAvailabilities(for: equipment)) { resolved in
                        showAllSessions = false
                        selectedResolved = resolved
                    }
                }
            }
        }
    }

    private func recommendationCard(_ recommendation: SessionRecommendation) -> some View {
        let session = recommendation.resolved.session
        return VStack(alignment: .leading, spacing: 12) {
            SessionCard(title: session.title, subtitle: session.subtitle)

            if !recommendation.resolved.substitutions.filter({ $0.equivalence == .partial }).isEmpty {
                // Discreet on purpose — UX.md "one card, one decision":
                // the full explanation belongs to the pre-session
                // summary, not to Home.
                Text("Séance adaptée à votre équipement")
                    .font(CASTypography.caption.weight(.medium))
                    .foregroundStyle(CASTheme.Colors.warning)
            }

            if !session.primaryActionCapability.isEmpty {
                // The Action Capability gets body-weight emphasis, not
                // caption — see 10-science/03_ACTION_CAPABILITIES.md:
                // "Action Capabilities constitute the true product of
                // CAS." It's the "why," modules and duration are
                // supporting detail.
                Text(session.primaryActionCapability)
                    .font(CASTypography.body.weight(.semibold))
                    .foregroundStyle(CASTheme.Colors.primaryText)
            }

            if !session.moduleNames.isEmpty {
                Text(session.moduleNames.joined(separator: " → "))
                    .font(CASTypography.caption)
                    .foregroundStyle(CASTheme.Colors.secondaryText)
            }

            Text(Self.formattedDuration(session.estimatedDurationMinutes))
                .font(CASTypography.caption)
                .foregroundStyle(CASTheme.Colors.secondaryText)
            Text(recommendation.reason)
                .font(CASTypography.caption)
                .foregroundStyle(CASTheme.Colors.secondaryText)
            PrimaryButton(title: "Commencer") {
                selectedResolved = recommendation.resolved
            }
        }
    }

    /// Reached only when the profile is genuinely `.loaded` and every one
    /// of the five sessions resolved `.unavailable` for its equipment —
    /// never shown while the profile is still loading or failed to load.
    private var noSessionAvailableCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Aucune séance disponible avec votre équipement actuel.")
                .font(CASTypography.body)
                .foregroundStyle(CASTheme.Colors.primaryText)
            HStack(spacing: 16) {
                Button("Modifier mon profil") { isEditingProfile = true }
                Button("Toutes les séances") { showAllSessions = true }
            }
            .font(CASTypography.caption.weight(.medium))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(CASTheme.Colors.secondaryBackground, in: RoundedRectangle(cornerRadius: CASTheme.Metrics.controlCornerRadius, style: .continuous))
    }

    /// Only ever visible for `.loading`/`.failed` — `.idle`, `.loaded` and
    /// `.missing` all render nothing here (`.missing` shows the
    /// full-screen onboarding cover instead).
    @ViewBuilder
    private var profileStatusBanner: some View {
        switch viewModel.profileLoadState {
        case .loading:
            ProgressView()
                .frame(maxWidth: .infinity)
        case .failed(let message):
            VStack(alignment: .leading, spacing: 8) {
                Text(message)
                    .font(CASTypography.caption)
                    .foregroundStyle(CASTheme.Colors.primaryText)
                Button("Réessayer") {
                    viewModel.retryLoadingProfile(using: profileStore)
                }
                .font(CASTypography.caption.weight(.semibold))
                .foregroundStyle(CASTheme.Colors.warning)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(CASTheme.Colors.secondaryBackground, in: RoundedRectangle(cornerRadius: CASTheme.Metrics.controlCornerRadius, style: .continuous))
        default:
            EmptyView()
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

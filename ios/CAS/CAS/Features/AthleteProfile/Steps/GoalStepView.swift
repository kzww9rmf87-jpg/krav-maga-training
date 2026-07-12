import SwiftUI

/// Step 4/5.
struct GoalStepView: View {
    @Binding var profile: AthleteProfile

    var body: some View {
        Form {
            Section("Objectif principal") {
                Picker("Objectif", selection: $profile.primaryGoal) {
                    ForEach(AthleteGoal.allCases, id: \.self) { goal in
                        Text(goal.displayName).tag(goal)
                    }
                }
                .onChange(of: profile.primaryGoal) { _, newValue in
                    // Keeps the two lists disjoint — without this, picking
                    // a goal as primary that was already checked as
                    // secondary would leave a stale, now-hidden entry
                    // behind in `secondaryGoals`.
                    profile.secondaryGoals.removeAll { $0 == newValue }
                }
            }

            // A goal can't be primary and secondary at once — switching
            // the primary goal away from a selected secondary one would
            // otherwise leave a stale, invisible entry in `secondaryGoals`.
            Section("Objectifs secondaires (optionnel)") {
                ForEach(AthleteGoal.allCases.filter { $0 != profile.primaryGoal }, id: \.self) { goal in
                    Toggle(goal.displayName, isOn: secondaryGoalBinding(for: goal))
                }
            }

            Section {
                TextField("Précisions (optionnel)", text: goalDescriptionBinding, axis: .vertical)
            }
        }
    }

    private func secondaryGoalBinding(for goal: AthleteGoal) -> Binding<Bool> {
        Binding(
            get: { profile.secondaryGoals.contains(goal) },
            set: { isOn in
                if isOn {
                    profile.secondaryGoals.append(goal)
                } else {
                    profile.secondaryGoals.removeAll { $0 == goal }
                }
            }
        )
    }

    private var goalDescriptionBinding: Binding<String> {
        Binding(
            get: { profile.goalDescription ?? "" },
            set: { profile.goalDescription = $0.isEmpty ? nil : $0 }
        )
    }
}

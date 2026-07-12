import SwiftUI

/// Step 2/5. Two separate scales on purpose — an athlete can be advanced
/// in Krav Maga and a complete beginner in strength training, or the
/// reverse.
struct ExperienceStepView: View {
    @Binding var profile: AthleteProfile

    var body: some View {
        Form {
            Section("Krav Maga") {
                Picker("Ancienneté", selection: $profile.combatExperience) {
                    ForEach(TrainingExperience.allCases, id: \.self) { experience in
                        Text(experience.displayName).tag(experience)
                    }
                }
                .pickerStyle(.segmented)
            }

            Section("Préparation physique") {
                Picker("Ancienneté", selection: $profile.strengthTrainingExperience) {
                    ForEach(TrainingExperience.allCases, id: \.self) { experience in
                        Text(experience.displayName).tag(experience)
                    }
                }
                .pickerStyle(.segmented)
            }
        }
    }
}

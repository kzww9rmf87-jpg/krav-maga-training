import SwiftUI

/// Step 3/5. Deliberately minimal input controls — a bounded `Stepper` and
/// a fixed set of duration choices — rather than a free-text/numeric
/// field: nothing here needs to validate anything, because nothing out of
/// range or nonsensical can be entered in the first place.
struct FrequencyDurationStepView: View {
    @Binding var profile: AthleteProfile

    private static let sessionsPerWeekRange = 0...7
    private static let durationChoices = [30, 45, 60, 90]

    var body: some View {
        Form {
            Section("Fréquence hebdomadaire") {
                Stepper(
                    "Krav Maga : \(profile.kravSessionsPerWeek)",
                    value: $profile.kravSessionsPerWeek,
                    in: Self.sessionsPerWeekRange
                )
                Stepper(
                    "CAS : \(profile.casSessionsPerWeek)",
                    value: $profile.casSessionsPerWeek,
                    in: Self.sessionsPerWeekRange
                )
            }

            Section("Durée de séance CAS") {
                Picker("Durée", selection: $profile.sessionDurationMinutes) {
                    ForEach(Self.durationChoices, id: \.self) { minutes in
                        Text("\(minutes) min").tag(minutes)
                    }
                }
                .pickerStyle(.segmented)
            }
        }
    }
}

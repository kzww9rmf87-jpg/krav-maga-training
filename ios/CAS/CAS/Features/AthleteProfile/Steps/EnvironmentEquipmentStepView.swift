import SwiftUI

/// Step 1/5. Owns the environment→equipment prefill interaction described
/// by `EquipmentPrefillAdvisor` — this view is the only place that calls
/// it, so onboarding and editing get identical behavior for free.
struct EnvironmentEquipmentStepView: View {
    @Binding var profile: AthleteProfile
    @State private var previousEnvironment: TrainingEnvironment
    @State private var pendingSuggestion: Set<Equipment>?

    init(profile: Binding<AthleteProfile>) {
        _profile = profile
        _previousEnvironment = State(initialValue: profile.wrappedValue.trainingEnvironment)
    }

    var body: some View {
        Form {
            Section("Environnement") {
                Picker("Environnement d'entraînement", selection: $profile.trainingEnvironment) {
                    ForEach(TrainingEnvironment.allCases, id: \.self) { environment in
                        Text(environment.displayName).tag(environment)
                    }
                }
                .onChange(of: profile.trainingEnvironment) { _, newValue in
                    handleEnvironmentChange(to: newValue)
                }
            }

            Section("Matériel disponible") {
                ForEach(Equipment.allCases, id: \.self) { equipment in
                    Toggle(equipment.displayName, isOn: equipmentBinding(for: equipment))
                }
            }

            Section {
                TextField("Précisions (optionnel)", text: equipmentNotesBinding, axis: .vertical)
            }
        }
        .alert(
            "Matériel suggéré",
            isPresented: Binding(get: { pendingSuggestion != nil }, set: { if !$0 { pendingSuggestion = nil } })
        ) {
            Button("Ajouter") {
                if let pendingSuggestion {
                    profile.availableEquipment = EquipmentPrefillAdvisor.applyingConfirmedSuggestion(
                        pendingSuggestion, to: profile.availableEquipment
                    )
                }
                pendingSuggestion = nil
            }
            Button("Garder ma sélection", role: .cancel) {
                pendingSuggestion = nil
            }
        } message: {
            Text(EquipmentPrefillAdvisor.confirmationPrompt)
        }
    }

    private func handleEnvironmentChange(to newEnvironment: TrainingEnvironment) {
        defer { previousEnvironment = newEnvironment }
        switch EquipmentPrefillAdvisor.decision(
            currentEquipment: profile.availableEquipment,
            previousEnvironment: previousEnvironment,
            newEnvironment: newEnvironment
        ) {
        case .noAction:
            break
        case .appliedAutomatically(let suggested):
            profile.availableEquipment = suggested
        case .needsConfirmation(let suggested):
            pendingSuggestion = suggested
        }
    }

    private func equipmentBinding(for equipment: Equipment) -> Binding<Bool> {
        Binding(
            get: { profile.availableEquipment.contains(equipment) },
            set: { isOn in
                if isOn {
                    profile.availableEquipment.insert(equipment)
                } else {
                    profile.availableEquipment.remove(equipment)
                }
            }
        )
    }

    private var equipmentNotesBinding: Binding<String> {
        Binding(
            get: { profile.equipmentNotes ?? "" },
            set: { profile.equipmentNotes = $0.isEmpty ? nil : $0 }
        )
    }
}

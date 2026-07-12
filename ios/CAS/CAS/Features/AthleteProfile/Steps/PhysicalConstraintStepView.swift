import SwiftUI

/// Step 5/5. A declaration, nothing more — per the validated decision
/// model, this field must never produce a diagnosis or a rehabilitation
/// protocol. It exists so a future decision engine has a prudent signal
/// to gate on, not to interpret what the constraint actually is.
struct PhysicalConstraintStepView: View {
    @Binding var profile: AthleteProfile

    var body: some View {
        Form {
            Section {
                Toggle("Contrainte physique active", isOn: $profile.hasActivePhysicalConstraint)
            } footer: {
                Text("Douleur récurrente, blessure en cours de gestion, limitation connue — sans détail médical requis.")
            }

            if profile.hasActivePhysicalConstraint {
                Section {
                    TextField("Précisions (optionnel)", text: notesBinding, axis: .vertical)
                }
            }
        }
    }

    private var notesBinding: Binding<String> {
        Binding(
            get: { profile.physicalConstraintNotes ?? "" },
            set: { profile.physicalConstraintNotes = $0.isEmpty ? nil : $0 }
        )
    }
}

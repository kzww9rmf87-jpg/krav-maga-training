import Foundation

/// The only substitution table populated in this increment — validated
/// prescriptions for the three CAS Puissance exercises that need
/// equipment. `cas-puissance-squat-saute` and
/// `cas-puissance-deplacements-lateraux` have no entry: their equipment
/// requirement is already empty (`ExerciseEquipmentRequirements`), so they
/// never reach substitution — `SessionAvailabilityResolver` resolves them
/// as `.original` directly.
///
/// Each prescription below is authored from scratch for its replacement
/// exercise — none of it is inherited from the original CAS Puissance
/// prescription. See the audit matrix for why each substitution is
/// `.partial`, never `.strong`: none of the three preserve the original's
/// full training regime.
enum CASPuissanceSubstitutions {
    static let byExerciseId: [String: ExerciseSubstitution] = [
        "cas-puissance-epaule-jete": ExerciseSubstitution(
            replacement: Exercise(
                id: "cas-puissance-epaule-jete-bw",
                name: "Saut en longueur explosif (broad jump)",
                primaryAdaptation: .power
            ),
            equivalence: .partial,
            prescription: SubstitutePrescription(
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: .bodyweight, reps: "3"),
                        SetSpec(load: .bodyweight, reps: "3"),
                        SetSpec(load: .bodyweight, reps: "3"),
                        SetSpec(load: .bodyweight, reps: "3"),
                        SetSpec(load: .bodyweight, reps: "3"),
                    ]),
                ],
                restGuidance: "2 min",
                note: "Retour marché entre les sauts, réception stable avant le saut suivant — dès que la distance diminue nettement, on arrête la série."
            )
        ),
        "cas-puissance-lancers-medecine-ball": ExerciseSubstitution(
            replacement: Exercise(
                id: "cas-puissance-lancers-bw",
                name: "Pompes pliométriques",
                primaryAdaptation: .power
            ),
            equivalence: .partial,
            prescription: SubstitutePrescription(
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(load: .bodyweight, reps: "5"),
                        SetSpec(load: .bodyweight, reps: "5"),
                        SetSpec(load: .bodyweight, reps: "5"),
                        SetSpec(load: .bodyweight, reps: "5"),
                    ]),
                ],
                restGuidance: "90 sec",
                note: "Décollage complet des mains à chaque répétition, réception souple des coudes — dès que le décollage diminue, on arrête la série. Si le décollage complet n'est pas encore accessible, régresser vers une pompe explosive sans quitter le sol."
            )
        ),
        "cas-puissance-rotation-tronc": ExerciseSubstitution(
            replacement: Exercise(
                id: "cas-puissance-rotation-bw",
                name: "Rotation du tronc à corps libre",
                primaryAdaptation: .movement,
                secondaryAdaptations: [.power]
            ),
            equivalence: .partial,
            prescription: SubstitutePrescription(
                groups: [
                    SetGroup(kind: .work, sets: [
                        SetSpec(label: "Contrôlé", load: .bodyweight, reps: "10 / côté"),
                        SetSpec(label: "Rapide", load: .bodyweight, reps: "10 / côté"),
                        SetSpec(label: "Explosif", load: .bodyweight, reps: "10 / côté"),
                    ]),
                ],
                restGuidance: "60 sec",
                note: "Sans charge externe, le palier Explosif travaille la vitesse et le contrôle en fin d'amplitude, pas la production de force contre résistance — la qualité du geste prime sur la vitesse pure."
            )
        ),
    ]
}

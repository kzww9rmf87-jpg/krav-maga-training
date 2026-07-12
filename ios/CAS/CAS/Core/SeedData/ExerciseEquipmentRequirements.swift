import Foundation

/// A set of equipment that, together, are sufficient on their own to
/// perform an exercise. An exercise's full requirement is a list of such
/// alternatives — satisfied if the athlete's `availableEquipment` is a
/// superset of *any one* alternative (e.g. "barre OU poulie" is
/// `[[.barbell], [.cableMachine]]`; "haltères ET banc incliné" is a single
/// alternative `[[.dumbbells, .bench]]`). An empty array means no
/// equipment is needed at all.
typealias EquipmentRequirement = [Set<Equipment>]

/// What each of the 24 CAS V0.1 exercises actually needs, transcribed
/// directly from the validated audit matrix — no interpretation added
/// here. Every exercise across all 5 sessions has an entry: an exercise
/// missing from this table is undocumented, not equipment-free, and
/// `SessionAvailabilityResolver` treats the two very differently.
enum ExerciseEquipmentRequirements {
    static let byExerciseId: [String: EquipmentRequirement] = [
        // CAS Force
        "cas-force-squat": [[.barbell, .rack]],
        "cas-force-developpe-couche": [[.barbell, .bench]],
        "cas-force-rowing": [[.barbell], [.cableMachine]],
        "cas-force-fentes": [],
        "cas-force-suspension": [[.pullUpBar]],
        "cas-force-gainage": [],

        // CAS Puissance
        "cas-puissance-epaule-jete": [[.dumbbells], [.kettlebell]],
        "cas-puissance-squat-saute": [],
        "cas-puissance-lancers-medecine-ball": [[.medicineBall]],
        "cas-puissance-rotation-tronc": [[.cableMachine], [.medicineBall]],
        "cas-puissance-deplacements-lateraux": [],

        // CAS Hypertrophie fonctionnelle
        "cas-hypertrophie-developpe-incline": [[.dumbbells, .bench]],
        "cas-hypertrophie-tractions": [[.pullUpBar], [.cableMachine]],
        "cas-hypertrophie-fentes-marchees": [],
        "cas-hypertrophie-elevations-laterales": [[.dumbbells], [.resistanceBands]],
        "cas-hypertrophie-superset-bras": [[.dumbbells, .cableMachine]],
        "cas-hypertrophie-releve-jambes": [[.pullUpBar]],

        // CAS Robustesse
        "cas-robustesse-farmer-carry": [[.dumbbells], [.kettlebell]],
        "cas-robustesse-isometrie-hanche": [],
        // A pull-up bar alone only allows an *unweighted* hang — the
        // "lestée" (weighted) part requires a loadable weight too, and
        // the two are both mandatory, not alternatives.
        "cas-robustesse-suspension-lestee": [[.pullUpBar, .externalLoad]],
        "cas-robustesse-gainage-rotatoire": [[.cableMachine], [.resistanceBands]],
        "cas-robustesse-retour-au-calme": [],

        // CAS Base aérobie
        "cas-base-aerobie-effort-continu": [],
        "cas-base-aerobie-retour-au-calme": [],
    ]
}

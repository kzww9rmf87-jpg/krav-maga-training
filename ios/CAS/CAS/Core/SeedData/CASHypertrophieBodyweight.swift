import Foundation

/// CAS Beta 1.0 — the native bodyweight-only implementation of CAS
/// Hypertrophie fonctionnelle's Action Capability (see
/// `CASHypertrophie.swift` for the barbell/dumbbell version).
/// `primaryActionCapability` is unchanged — Action Capabilities are
/// invariants across environments.
///
/// Module choice: push volume (three push variants covering horizontal,
/// shoulder-dominant and triceps-dominant emphasis) and leg volume
/// (fentes marchées, already natively bodyweight) carry the session's
/// hypertrophy intent, matching the original's four-exercise
/// `functionalHypertrophy` block. Vertical pull (tractions) and isolated
/// arm/deltoid work (élévations latérales, curl/triceps superset) have
/// **no reliable bodyweight equivalent** — this loss is not disguised:
/// the Superman/extension dorsale approximates posterior-chain stimulus
/// but does not train the lats, and pike push-ups approximate shoulder
/// loading but do not isolate the deltoid the way a lateral raise does.
/// `core` (floor leg raise → V-up) replaces the suspended leg raise with
/// an equally well-established progression that needs no anchor.
///
/// Autoregulation: RPE 8-9 (1-2 reps in reserve) — higher than CAS Force,
/// since these are lower-skill, higher-rep movements where training
/// closer to fatigue carries less technical risk and better matches a
/// hypertrophy-oriented volume regime. Same advance/hold rule as CAS
/// Force: two easy sessions in a row → next step now; two sessions at
/// RPE 9+ with breakdown → hold or regress.
enum CASHypertrophieBodyweight {
    static let session = TrainingSession(
        id: "cas-hypertrophie-bodyweight",
        title: "CAS Hypertrophie fonctionnelle — Poids du corps",
        subtitle: "Construire de la masse utile sans matériel, sans dégrader la mobilité ni la récupération",
        format: .standard(modules: [
            SessionModule(
                module: CapabilityModuleCatalog.functionalHypertrophy,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-bodyweight-pompes-largeur",
                            name: "Pompes (largeur variable)",
                            primaryAdaptation: .functionalHypertrophy
                        ),
                        restGuidance: "60-90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "10-12"),
                                SetSpec(load: .bodyweight, reps: "10-12"),
                                SetSpec(load: .bodyweight, reps: "10-12"),
                            ]),
                        ],
                        note: "Semaines 1-2 : 3-4 séries de 10-12. Semaines 3-4 : 4 séries de 12-15. Semaines 5-6 : 4 séries de 8-10, tempo lent (3-1-1) — bascule vers la tension quand le volume plafonne. Seul patron de poussée pleinement reproductible sans matériel. Viser RPE 8-9."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-bodyweight-pompes-pike",
                            name: "Pompes pike",
                            primaryAdaptation: .functionalHypertrophy
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "8-10"),
                                SetSpec(load: .bodyweight, reps: "8-10"),
                                SetSpec(load: .bodyweight, reps: "8-10"),
                            ]),
                        ],
                        note: "Semaines 1-2 : 3 séries de 8-10. Semaines 3-4 : 3-4 séries de 10-12. Semaines 5-6 : 4 séries de 8-10, appui maximal sur les orteils. Approxime le travail d'épaule des élévations latérales — ce n'est pas une isolation, seulement le patron de poussée le plus épaule-dominant disponible. Viser RPE 8-9."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-bodyweight-fentes-marchees",
                            name: "Fentes marchées",
                            primaryAdaptation: .functionalHypertrophy
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "10-12 / jambe"),
                                SetSpec(load: .bodyweight, reps: "10-12 / jambe"),
                                SetSpec(load: .bodyweight, reps: "10-12 / jambe"),
                            ]),
                        ],
                        note: "Semaines 1-2 : 3 séries de 10-12. Semaines 3-4 : 4 séries de 10-12. Semaines 5-6 : 4 séries de 12-15. Déjà exécutable sans matériel, volume orienté comme dans la version salle. Viser RPE 8-9."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-bodyweight-pompes-diamant",
                            name: "Pompes diamant",
                            primaryAdaptation: .functionalHypertrophy
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "8-10"),
                                SetSpec(load: .bodyweight, reps: "8-10"),
                                SetSpec(load: .bodyweight, reps: "8-10"),
                            ]),
                        ],
                        note: "Semaines 1-2 : 3 séries de 8-10. Semaines 3-4 : 3-4 séries de 10-12. Semaines 5-6 : 4 séries de 8-10, tempo lent. Approxime partiellement le travail triceps du superset d'origine — pas d'isolation biceps possible sans matériel, cette perte n'est pas compensée. Viser RPE 8-9."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-bodyweight-superman",
                            name: "Superman / extension dorsale",
                            primaryAdaptation: .functionalHypertrophy,
                            secondaryAdaptations: [.movement]
                        ),
                        restGuidance: "45-60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "12-15"),
                                SetSpec(load: .bodyweight, reps: "12-15"),
                                SetSpec(load: .bodyweight, reps: "12-15"),
                            ]),
                        ],
                        note: "Semaines 1-2 : 3 séries de 12-15. Semaines 3-4 : 3 séries de 15-18. Semaines 5-6 : 3-4 séries de 10-12 avec pause de 2 s en haut. Sollicite les érecteurs spinaux et les fessiers — ne sollicite pas le grand dorsal. N'est pas un substitut du tirage, seulement la meilleure option disponible pour ne pas laisser la chaîne postérieure haute totalement absente. Viser RPE 8-9."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.core,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-hypertrophie-bodyweight-leg-raise",
                            name: "Relevé de jambes au sol (progression vers V-up)",
                            primaryAdaptation: .movement,
                            secondaryAdaptations: [.robustness]
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "10-12"),
                                SetSpec(load: .bodyweight, reps: "10-12"),
                                SetSpec(load: .bodyweight, reps: "10-12"),
                            ]),
                        ],
                        note: "Semaines 1-2 : genoux fléchis, 3 séries de 10-12. Semaines 3-4 : jambes tendues, 3 séries de 8-10. Semaines 5-6 : V-up ou hollow body hold, 3 séries de 6-8 (ou 20-30 s de tenue). Remplace la version suspendue par une progression tout aussi bien établie, sans besoin d'ancrage. Viser RPE 8-9."
                    ),
                ]
            ),
        ]),
        primaryActionCapability: "Déplacer une charge à répétition"
    )
}

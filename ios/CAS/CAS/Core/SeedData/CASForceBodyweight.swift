import Foundation

/// CAS Beta 1.0 — the native bodyweight-only implementation of CAS
/// Force's Action Capability, not a per-exercise substitution of the
/// barbell version (see `CASForce.swift`). Reconstructed from the same
/// intention — produce an important force and transfer it efficiently —
/// using only movements executable with zero equipment and no assumed
/// anchor point (no furniture, table, door, or unverified structure).
///
/// `primaryActionCapability` is unchanged from the barbell version —
/// Action Capabilities are invariants across environments; only the
/// implementation changes.
///
/// Module choice mirrors the original's logic: two unilateral leverage
/// exercises (pistol squat, archer push-up) carry the session's maximal-
/// strength intent, the same way squat and bench did. Horizontal pull
/// (rowing) has **no credible bodyweight equivalent without an anchor** —
/// this loss is not compensated. The single-leg hip thrust is included
/// for its own value as a posterior-chain force producer, not as a
/// substitute for rowing. `functionalHypertrophy` (fentes) is already
/// natively bodyweight, ported unchanged. `robustness` (isometric
/// push-up hold) and `core` (planche lean) replace the barbell version's
/// grip (dead hang) and core blocks with the closest tendon-tolerance
/// and force-transmission work achievable without a bar.
///
/// Autoregulation: every exercise targets RPE 7-8 (2-3 reps in reserve)
/// — deliberately conservative, since these are skill-limited movements
/// where technical breakdown near failure is an injury risk, unlike a
/// barbell lift where the load itself limits the set. Two consecutive
/// sessions completed comfortably below that RPE band mean the athlete
/// should advance to the next progression step immediately, without
/// waiting for the suggested week. Two sessions at RPE 9+ with degrading
/// form mean staying at the current step, or regressing one.
enum CASForceBodyweight {
    static let session = TrainingSession(
        id: "cas-force-bodyweight",
        title: "CAS Force — Poids du corps",
        subtitle: "Produire une force importante et la transférer efficacement, sans matériel",
        format: .standard(modules: [
            SessionModule(
                module: CapabilityModuleCatalog.strength,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-bodyweight-pistol-squat",
                            name: "Squat pistol (progression)",
                            primaryAdaptation: .maximumStrength
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "5-6 / jambe"),
                                SetSpec(load: .bodyweight, reps: "5-6 / jambe"),
                                SetSpec(load: .bodyweight, reps: "5-6 / jambe"),
                                SetSpec(load: .bodyweight, reps: "5-6 / jambe"),
                            ]),
                        ],
                        note: "Semaines 1-2 : assisté, une main en appui léger sur la cuisse. Semaines 3-4 : descente complète en pistol, remontée assistée. Semaines 5-6 : pistol complet, bras en contrepoids, sans appui. Tempo 3-1-1. Viser RPE 7-8 — deux séances faciles d'affilée, passer au palier suivant sans attendre."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-bodyweight-archer-pushup",
                            name: "Pompes archer (progression vers une main)",
                            primaryAdaptation: .maximumStrength,
                            secondaryAdaptations: [.power]
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "6-10"),
                                SetSpec(load: .bodyweight, reps: "6-10"),
                                SetSpec(load: .bodyweight, reps: "6-10"),
                                SetSpec(load: .bodyweight, reps: "6-10"),
                            ]),
                        ],
                        note: "Semaines 1-2 : pompes larges. Semaines 3-4 : archer, transfert de poids latéral, 4-6 / côté. Semaines 5-6 : archer profond ou négatives à un bras, 3-5 / côté. Tempo 3-1-1 (4-1-1 aux semaines 5-6). Viser RPE 7-8."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-bodyweight-single-leg-hip-thrust",
                            name: "Pont fessier unilatéral (progression)",
                            primaryAdaptation: .maximumStrength,
                            secondaryAdaptations: [.robustness]
                        ),
                        restGuidance: "60-90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "12-15"),
                                SetSpec(load: .bodyweight, reps: "12-15"),
                                SetSpec(load: .bodyweight, reps: "12-15"),
                            ]),
                        ],
                        note: "Semaines 1-2 : bilatéral. Semaines 3-4 : unilatéral, jambe libre tendue, 8-10 / jambe. Semaines 5-6 : unilatéral avec pause 2-3 s en haut, 6-8 / jambe. Inclus pour sa propre valeur de production de force par la chaîne postérieure — ne compense pas le tirage horizontal, qui n'a aucun équivalent bodyweight fiable. Viser RPE 7-8."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.functionalHypertrophy,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-bodyweight-fentes",
                            name: "Fentes (statiques puis marchées)",
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
                        note: "Semaines 1-2 : statiques. Semaines 3-4 : marchées. Semaines 5-6 : marchées, tempo lent (3-1-1). Déjà exécutable sans matériel — aucune adaptation nécessaire par rapport à l'intention d'origine. Viser RPE 7-8."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.robustness,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-bodyweight-isometric-pushup-hold",
                            name: "Pompes isométriques (tenue progressive)",
                            primaryAdaptation: .robustness
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "20-30 sec"),
                                SetSpec(load: .bodyweight, reps: "20-30 sec"),
                                SetSpec(load: .bodyweight, reps: "20-30 sec"),
                            ]),
                        ],
                        note: "Semaines 1-2 : position haute (bras tendus). Semaines 3-4 : position médiane (coudes à 90°). Semaines 5-6 : position basse, proche du sol. Tolérance tendineuse épaule/coude — ne remplace pas la suspension à la barre. Arrêter dès la première dégradation de position, pas seulement au chrono."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.core,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-force-bodyweight-planche-lean",
                            name: "Planche lean (progression vers tuck planche)",
                            primaryAdaptation: .movement,
                            secondaryAdaptations: [.robustness]
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "15-20 sec"),
                                SetSpec(load: .bodyweight, reps: "15-20 sec"),
                                SetSpec(load: .bodyweight, reps: "15-20 sec"),
                            ]),
                        ],
                        note: "Semaines 1-2 : inclinaison légère (~15-20°). Semaines 3-4 : inclinaison modérée (~30°). Semaines 5-6 : profonde, ou tuck planche brève. Transmet la force du tronc vers les bras, plus spécifique qu'un gainage statique. Charge le poignet jusqu'à 3-4× le poids du corps — progression prudente, pas plus de 4 séances/semaine sur ce mouvement. Arrêter dès la première perte d'alignement."
                    ),
                ]
            ),
        ]),
        primaryActionCapability: "Produire une force importante et la transmettre efficacement"
    )
}

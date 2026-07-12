import Foundation

/// CAS Beta 1.0 — the native bodyweight-only implementation attached to
/// CAS Robustesse's Action Capability (see `CASRobustesse.swift` for the
/// loaded version). `primaryActionCapability` is **unchanged** —
/// "Maintenir une prise malgré une résistance" — Action Capabilities are
/// invariants across environments and are never reworded to fit what a
/// given environment can actually deliver.
///
/// This is the one CAS V0.1 session where that invariant is hardest to
/// honor honestly: farmer carry and suspension lestée both require
/// external load by definition, and no bodyweight movement reproduces
/// "maintaining a grip against resistance." Nothing below trains that
/// capacity. This session's real purpose is narrower than its Action
/// Capability's name — it preserves general robustness (tendon and
/// joint tolerance under sustained bodyweight tension) while an athlete
/// has no access to loadable equipment, not a replacement for grip
/// training under load. When that equipment becomes available again,
/// the loaded version is what actually trains the stated capability.
///
/// Module choice: `robustness` carries the isometric tolerance work
/// (L-sit, hip isometry — unchanged from the original — and the deep
/// push-up hold replacing suspension lestée). `core` keeps the
/// anti-rotation block essentially as in the original (already
/// bodyweight-native). `recovery` is ported unchanged — nothing about
/// active recovery required equipment in the first place.
///
/// Autoregulation: these are isometric holds, not rep-based sets, so RIR
/// doesn't apply numerically. The rule is quality-based instead: hold
/// only as long as position and tension stay correct, stop at the first
/// sign of degradation (shaking, loss of alignment) rather than waiting
/// for the clock. Two sessions with a fully stable hold at the target
/// duration → advance to the next step; any early degradation → hold or
/// regress.
enum CASRobustesseBodyweight {
    static let session = TrainingSession(
        id: "cas-robustesse-bodyweight",
        title: "CAS Robustesse — Poids du corps",
        subtitle: "Résister aux contraintes mécaniques et préserver l'intégrité physique",
        format: .standard(modules: [
            SessionModule(
                module: CapabilityModuleCatalog.robustness,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-robustesse-bodyweight-l-sit",
                            name: "L-sit (progression)",
                            primaryAdaptation: .robustness,
                            secondaryAdaptations: [.movement]
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "10-15 sec"),
                                SetSpec(load: .bodyweight, reps: "10-15 sec"),
                                SetSpec(load: .bodyweight, reps: "10-15 sec"),
                            ]),
                        ],
                        note: "Semaines 1-2 : tuck, pieds en appui partiel au sol. Semaines 3-4 : tuck complet, pieds décollés. Semaines 5-6 : une jambe tendue, ou complet bref. Tension isométrique réelle sur les poignets et les fléchisseurs de hanche — ne reproduit pas la préhension sous charge, vise la tolérance tissulaire générale en attendant un environnement permettant le travail de préhension chargée. Arrêter dès la première dégradation de la position."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-robustesse-bodyweight-isometrie-hanche",
                            name: "Isométrie hanche (adduction/abduction) ou planche latérale",
                            primaryAdaptation: .robustness
                        ),
                        restGuidance: "45-60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "30-45 sec"),
                                SetSpec(load: .bodyweight, reps: "30-45 sec"),
                                SetSpec(load: .bodyweight, reps: "30-45 sec"),
                                SetSpec(load: .bodyweight, reps: "30-45 sec"),
                            ]),
                        ],
                        note: "Déjà exécutable sans matériel, inchangé par rapport à la version salle. Progression sur la durée uniquement : 30-45 s (semaines 1-2) → 35-50 s (semaines 3-4) → 45-60 s (semaines 5-6). Arrêter dès la première dégradation de la position."
                    ),
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-robustesse-bodyweight-isometric-pushup",
                            name: "Pompes isométriques profondes (progression)",
                            primaryAdaptation: .robustness
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "15-20 sec"),
                                SetSpec(load: .bodyweight, reps: "15-20 sec"),
                                SetSpec(load: .bodyweight, reps: "15-20 sec"),
                            ]),
                        ],
                        note: "Semaines 1-2 : position médiane (coudes à 90°). Semaines 3-4 : position basse, proche du sol. Semaines 5-6 : position basse avec micro-oscillations. Remplace la suspension lestée sur le plan de la tolérance tendineuse épaule/coude — pas sur celui de la préhension chargée. Arrêter dès la première dégradation."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.core,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-robustesse-bodyweight-anti-rotation",
                            name: "Gainage anti-rotation au sol",
                            primaryAdaptation: .movement,
                            secondaryAdaptations: [.robustness]
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "10-12 / côté"),
                                SetSpec(load: .bodyweight, reps: "10-12 / côté"),
                                SetSpec(load: .bodyweight, reps: "10-12 / côté"),
                            ]),
                        ],
                        note: "Progression par la durée de tenue par répétition : 2 s (semaines 1-2) → 3 s (semaines 3-4) → 4 s (semaines 5-6). Déjà natif, quasiment inchangé par rapport à la version salle. Stabilise le tronc contre la rotation, comme dans l'intention d'origine."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.recovery,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "cas-robustesse-bodyweight-retour-au-calme",
                            name: "Étirements / mobilité guidée ou respiration diaphragmatique",
                            primaryAdaptation: .recovery
                        ),
                        note: "La récupération fait partie de l'entraînement, pas une option.",
                        freeText: "5-8 min, faible intensité."
                    ),
                ]
            ),
        ]),
        primaryActionCapability: "Maintenir une prise malgré une résistance"
    )
}

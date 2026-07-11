import Foundation

/// Ported from src/data/seanceD.js. Sprint 1.5: reassembled as Capability
/// Modules — see `20-engine/01_MODULE_ENGINE.md`.
///
/// Module choice: each exercise here targets a genuinely distinct
/// purpose, so the session assembles six single-exercise modules rather
/// than merging any of them — `movement` (full range-of-motion hip
/// work), `power` (weighted leg raise + knee strike), `strength` (SDT à
/// genoux), `core` (trunk rotation — same placement as in Séance B),
/// `robustness` (isometric hip hold, matches the module's tendon/joint
/// definition directly), `functionalHypertrophy` (calf raises).
///
/// KNOWN ORDER CHANGE vs. the original src/data/seanceD.js sequence: the
/// source order was Presse, Relevés de jambe lestés, **SDT à genoux**,
/// Coups de genou, Rotation, Adductions, Extensions — SDT à genoux ran
/// *before* Coups de genou. Because a `SessionModule` is one contiguous
/// exercise block, and the two Power exercises (Relevés de jambe lestés,
/// Coups de genou) are not adjacent in the source order (SDT à genoux, a
/// Strength exercise, sits between them), merging both Power exercises
/// into one block shifts SDT à genoux to run *after* Coups de genou
/// instead of before. This is the only exercise-order change across all
/// five demo sessions (see Sprint 1.5 commit dcf4cc9). No set, rep, load
/// or rest value changes — accepted as-is per Sprint 1.5 review.
enum SeanceD {
    static let session = TrainingSession(
        id: LegacySessionID.seanceD.rawValue,
        title: "Séance D — Spécialisation pieds",
        subtitle: "Renforcement ciblé des chaînes musculaires du coup de pied",
        format: .standard(modules: [
            SessionModule(
                module: CapabilityModuleCatalog.movement,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "presse-cuisses-amplitude",
                            name: "Presse à cuisses pleine amplitude",
                            primaryAdaptation: .movement,
                            secondaryAdaptations: [.functionalHypertrophy]
                        ),
                        restGuidance: "2-3 min",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .custom("Progressive"), reps: "12"),
                                SetSpec(load: .custom("Progressive"), reps: "10"),
                                SetSpec(load: .custom("Progressive"), reps: "10"),
                                SetSpec(load: .custom("Progressive"), reps: "8"),
                            ]),
                        ],
                        note: "Amplitude complète (à l'inverse des squats partiels de la séance A) : on "
                            + "travaille ici la mobilité et la force sur toute l'amplitude de la hanche, "
                            + "essentielle pour la hauteur et l'amplitude des coups de pied."
                    ),
                ]
            ),
            SessionModule(
                // Merging these two Power exercises into one contiguous
                // block is what causes the order swap documented above —
                // SDT à genoux (the Strength module right after this one)
                // now runs after Coups de genou, not before it.
                module: CapabilityModuleCatalog.power,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "releve-jambe-leste",
                            name: "Relevés de jambe lestés",
                            primaryAdaptation: .power,
                            secondaryAdaptations: [.specificSkill]
                        ),
                        restGuidance: "90 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .custom("2-3kg"), reps: "8"),
                                SetSpec(load: .custom("3-4kg"), reps: "8"),
                                SetSpec(load: .custom("4-5kg"), reps: "8"),
                            ]),
                        ],
                        note: SeedNotes.stopAndGo
                    ),
                    SessionExercise(
                        exercise: SharedExercises.kneeStrikeOnAllFours,
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "10 / jambe"),
                                SetSpec(load: .bodyweight, reps: "10 / jambe"),
                                SetSpec(load: .bodyweight, reps: "10 / jambe"),
                                SetSpec(load: .bodyweight, reps: "10 / jambe"),
                            ]),
                        ],
                        note: "Volume plus élevé qu'en séance B (4 séries) pour ancrer le mouvement en "
                            + "spécialisation pieds."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.strength,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "sdt-genoux",
                            name: "SDT à genoux",
                            primaryAdaptation: .maximumStrength
                        ),
                        restGuidance: "2-3 min",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .weighted(value: 60, unit: .kg), reps: "8"),
                                SetSpec(load: .weighted(value: 65, unit: .kg), reps: "6"),
                                SetSpec(load: .weighted(value: 70, unit: .kg), reps: "5"),
                            ]),
                        ],
                        note: "Position à genoux : supprime la contribution des jambes, isole les "
                            + "lombaires et le grand dorsal — variante stricte du soulevé de terre classique."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.core,
                exercises: [
                    SessionExercise(
                        exercise: SharedExercises.lyingTrunkRotation,
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "15 / côté"),
                                SetSpec(load: .bodyweight, reps: "15 / côté"),
                                SetSpec(load: .bodyweight, reps: "15 / côté"),
                            ]),
                        ],
                        note: "Renforce le gainage rotatoire, nécessaire à la stabilité du bassin lors "
                            + "des coups de pied circulaires."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.robustness,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "adduction-isometrique",
                            name: "Adductions isométriques",
                            primaryAdaptation: .robustness
                        ),
                        restGuidance: "45 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .bodyweight, reps: "30 sec"),
                                SetSpec(load: .bodyweight, reps: "30 sec"),
                                SetSpec(load: .bodyweight, reps: "30 sec"),
                                SetSpec(load: .bodyweight, reps: "30 sec"),
                                SetSpec(load: .bodyweight, reps: "30 sec"),
                            ]),
                        ],
                        note: "Tenue isométrique : renforce la stabilité de la hanche en "
                            + "abduction/adduction, zone très sollicitée et souvent blessée dans les "
                            + "sports pieds-poings."
                    ),
                ]
            ),
            SessionModule(
                module: CapabilityModuleCatalog.functionalHypertrophy,
                exercises: [
                    SessionExercise(
                        exercise: Exercise(
                            id: "extension-mollet-debout",
                            name: "Extensions mollets debout",
                            primaryAdaptation: .functionalHypertrophy,
                            secondaryAdaptations: [.power]
                        ),
                        restGuidance: "60 sec",
                        groups: [
                            SetGroup(kind: .work, sets: [
                                SetSpec(load: .custom("Progressive"), reps: "12-15"),
                                SetSpec(load: .custom("Progressive"), reps: "12-15"),
                                SetSpec(load: .custom("Progressive"), reps: "12-15"),
                                SetSpec(load: .custom("Progressive"), reps: "12-15"),
                            ]),
                        ],
                        note: "Force des mollets = transmission finale de la puissance au sol sur "
                            + "l'appui du coup de pied."
                    ),
                ]
            ),
        ])
    )
}

import { STOP_AND_GO_NOTE } from './seanceA'

export const seanceD = {
  title: 'Séance D — Spécialisation pieds',
  subtitle: 'Renforcement ciblé des chaînes musculaires du coup de pied',
  exercises: [
    {
      name: 'Presse à cuisses pleine amplitude',
      rest: '2-3 min',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: 'Progressive', reps: '12' },
            { charge: 'Progressive', reps: '10' },
            { charge: 'Progressive', reps: '10' },
            { charge: 'Progressive', reps: '8' },
          ],
        },
      ],
      note:
        "Amplitude complète (à l'inverse des squats partiels de la séance A) : on travaille ici la mobilité et la force sur toute l'amplitude de la hanche, essentielle pour la hauteur et l'amplitude des coups de pied.",
    },
    {
      name: 'Relevés de jambe lestés',
      rest: '90 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: '2-3kg', reps: '8' },
            { charge: '3-4kg', reps: '8' },
            { charge: '4-5kg', reps: '8' },
          ],
        },
      ],
      note: STOP_AND_GO_NOTE,
    },
    {
      name: 'SDT à genoux',
      rest: '2-3 min',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: '60kg', reps: '8' },
            { charge: '65kg', reps: '6' },
            { charge: '70kg', reps: '5' },
          ],
        },
      ],
      note:
        'Position à genoux : supprime la contribution des jambes, isole les lombaires et le grand dorsal — variante stricte du soulevé de terre classique.',
    },
    {
      name: 'Coups de genou à quatre pattes',
      rest: '60 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: '—', reps: '10 / jambe' },
            { charge: '—', reps: '10 / jambe' },
            { charge: '—', reps: '10 / jambe' },
            { charge: '—', reps: '10 / jambe' },
          ],
        },
      ],
      note: 'Volume plus élevé qu\'en séance B (4 séries) pour ancrer le mouvement en spécialisation pieds.',
    },
    {
      name: 'Rotations du buste allongé',
      rest: '60 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: '—', reps: '15 / côté' },
            { charge: '—', reps: '15 / côté' },
            { charge: '—', reps: '15 / côté' },
          ],
        },
      ],
      note:
        'Renforce le gainage rotatoire, nécessaire à la stabilité du bassin lors des coups de pied circulaires.',
    },
    {
      name: 'Adductions isométriques',
      rest: '45 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: '—', reps: '30 sec' },
            { charge: '—', reps: '30 sec' },
            { charge: '—', reps: '30 sec' },
            { charge: '—', reps: '30 sec' },
            { charge: '—', reps: '30 sec' },
          ],
        },
      ],
      note:
        "Tenue isométrique : renforce la stabilité de la hanche en abduction/adduction, zone très sollicitée et souvent blessée dans les sports pieds-poings.",
    },
    {
      name: 'Extensions mollets debout',
      rest: '60 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: 'Progressive', reps: '12-15' },
            { charge: 'Progressive', reps: '12-15' },
            { charge: 'Progressive', reps: '12-15' },
            { charge: 'Progressive', reps: '12-15' },
          ],
        },
      ],
      note: 'Force des mollets = transmission finale de la puissance au sol sur l\'appui du coup de pied.',
    },
  ],
}

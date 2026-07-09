import { STOP_AND_GO_NOTE } from './seanceA'

export const seanceB = {
  title: 'Séance B — Explosivité + Pieds',
  subtitle: "Vitesse d'exécution maximale sur chaque répétition",
  exercises: [
    {
      name: 'Épaulés-jetés haltères',
      rest: '2-3 min',
      groups: [
        { type: 'chauffe', rows: [{ charge: '20kg', reps: '8' }] },
        {
          type: 'travail',
          rows: [
            { charge: '30kg', reps: '6' },
            { charge: '35kg', reps: '6' },
            { charge: '38kg', reps: '6' },
          ],
        },
      ],
      note:
        "Mouvement complet hanche-épaule à vitesse maximale — transfert direct vers la puissance de percussion et l'explosivité générale.",
    },
    {
      name: 'Coups de poing poulie',
      rest: '90 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { serie: '1 — Position 6-7', charge: '—', reps: '10 vitesse max' },
            { serie: '2 — Position 6-7', charge: '—', reps: '10 vitesse max' },
            { serie: '3 — Position 6-7', charge: '—', reps: '10 vitesse max' },
            { serie: '4 — Position 7-8', charge: '—', reps: '10 vitesse max' },
            { serie: '5 — Position 7-8', charge: '—', reps: '10 vitesse max' },
          ],
        },
      ],
      note:
        "Réglage de poulie en position 6-7 puis 7-8 : la résistance/l'angle augmente progressivement. Chaque répétition à vitesse maximale — c'est un exercice de puissance, pas d'endurance.",
    },
    {
      name: 'Lancers medicine ball',
      rest: '90 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: '4-6kg', reps: '15' },
            { charge: '4-6kg', reps: '15' },
            { charge: '4-6kg', reps: '15' },
            { charge: '4-6kg', reps: '15' },
          ],
        },
      ],
      note:
        'Lancer complet du buste — transfert de puissance des jambes vers les bras, similaire à la chaîne cinétique d\'un coup de poing.',
    },
    {
      name: 'Relevés de jambe debout lestés',
      rest: '90 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: '2-3kg', reps: '6' },
            { charge: '3-4kg', reps: '6' },
            { charge: '4-5kg', reps: '6' },
            { charge: '4-5kg', reps: '6' },
          ],
        },
      ],
      note: STOP_AND_GO_NOTE + ' Ici appliqué au relevé de jambe lesté — clé pour la puissance de coup de pied/genou.',
    },
    {
      name: 'Squats partiels explosifs',
      rest: '2-3 min',
      groups: [
        { type: 'chauffe', rows: [{ charge: '50kg', reps: '10' }] },
        {
          type: 'travail',
          rows: [
            { charge: '65kg', reps: '8' },
            { charge: '70kg', reps: '8' },
            { charge: '75kg', reps: '6' },
          ],
        },
      ],
      note:
        'Même mouvement que la séance A mais orienté vitesse de sortie plutôt que charge maximale — développe la puissance de détente des jambes.',
    },
    {
      name: 'Coups de genou à quatre pattes',
      rest: '60 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { serie: '1 — Contrôlé', charge: '—', reps: '10 / jambe' },
            { serie: '2 — Rapide', charge: '—', reps: '10 / jambe' },
            { serie: '3 — Explosif', charge: '—', reps: '10 / jambe' },
          ],
        },
      ],
      note:
        "Progression contrôlé → rapide → explosif : on apprend d'abord la trajectoire, puis on l'accélère au maximum. Directement transférable au coup de genou en combat.",
    },
    {
      name: 'Relevés de jambe barre fixe',
      rest: '90 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: '—', reps: '15-20' },
            { charge: '—', reps: '15-20' },
            { charge: '—', reps: '15-20' },
          ],
        },
        { type: 'option', rows: [{ serie: 'MAX', charge: '—', reps: 'Max reps' }] },
      ],
      note: 'Gainage suspendu — renforce la sangle abdominale basse et la préhension en même temps.',
    },
    {
      name: 'Rotations du buste allongé',
      rest: '60 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { serie: '1 — Contrôlé', charge: '—', reps: '15 / côté' },
            { serie: '2 — Rapide', charge: '—', reps: '15 / côté' },
            { serie: '3 — Explosif', charge: '—', reps: '15 / côté' },
          ],
        },
      ],
      note:
        'Rotation du tronc = transmission de la force entre le bas et le haut du corps, essentielle pour la puissance de frappe en rotation.',
    },
  ],
}

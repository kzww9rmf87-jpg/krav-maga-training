export const bras = {
  title: 'Bras (optionnel)',
  subtitle: 'À ajouter en fin de séance si la récupération le permet',
  exercises: [
    {
      name: 'Hammer curls',
      rest: '90 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: '14kg', reps: '10' },
            { charge: '16kg', reps: '10' },
            { charge: '18kg', reps: '8' },
            { charge: '20kg', reps: '8' },
          ],
        },
      ],
      note: "Prise marteau = sollicite le brachial et l'avant-bras, utile pour la force de préhension.",
    },
    {
      name: 'Curl barre EZ',
      rest: '90 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: '25kg', reps: '8' },
            { charge: '30kg', reps: '8' },
            { charge: '35kg', reps: '6' },
          ],
        },
      ],
      note: "Exercice d'isolation biceps — volume d'accessoire, non prioritaire sur les mouvements de force/explosivité.",
    },
    {
      name: 'Extensions triceps poulie',
      rest: '60-90 sec',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: '30kg', reps: '12' },
            { charge: '35kg', reps: '10' },
            { charge: '40kg', reps: '8' },
          ],
        },
      ],
      note: 'Complète le travail de poussée du développé-couché de la séance A.',
    },
    {
      name: 'Wrist extensions + curls',
      rest: '45 sec entre super-sets',
      groups: [
        {
          type: 'option',
          rows: [
            { serie: 'Super-set 1', charge: 'Léger', reps: '15 + 15' },
            { serie: 'Super-set 2', charge: 'Léger', reps: '15 + 15' },
            { serie: 'Super-set 3', charge: 'Léger', reps: '15 + 15' },
          ],
        },
      ],
      note:
        'Enchaînement extension puis flexion du poignet sans repos — prévention des blessures et renforcement de la préhension pour les saisies et les frappes.',
    },
  ],
}

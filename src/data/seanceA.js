export const STOP_AND_GO_NOTE =
  "Stop & Go : chaque répétition part à l'arrêt complet (pas de rebond, pas d'élan). Cela supprime l'énergie élastique du mouvement et force le muscle à produire toute la force lui-même — clé pour développer la force de démarrage explosive utile en combat."

export const seanceA = {
  title: 'Séance A — Force maximale',
  subtitle: 'Demi-pyramide montante · Stop & Go sur toutes les répétitions',
  exercises: [
    {
      name: 'Développé-couché mains serrées',
      rest: '3-4 min entre séries lourdes',
      groups: [
        {
          type: 'chauffe',
          rows: [
            { charge: '50kg', reps: '15' },
            { charge: '65kg', reps: '8' },
          ],
        },
        {
          type: 'travail',
          rows: [
            { charge: '75kg', reps: '5' },
            { charge: '80kg', reps: '4' },
            { charge: '85kg', reps: '3' },
            { charge: '88-90kg', reps: '2-3' },
          ],
        },
      ],
      note:
        STOP_AND_GO_NOTE +
        ' Prise serrée = sollicitation triceps/coude, essentielle pour la puissance de poussée directe (coup de poing, garde).',
    },
    {
      name: 'Squats partiels',
      rest: '3-4 min',
      groups: [
        {
          type: 'chauffe',
          rows: [
            { charge: '60kg', reps: '15' },
            { charge: '80kg', reps: '8' },
          ],
        },
        {
          type: 'travail',
          rows: [
            { charge: '90kg', reps: '6' },
            { charge: '95kg', reps: '5' },
            { charge: '98kg', reps: '4' },
            { charge: '100kg', reps: '3' },
          ],
        },
      ],
      note:
        "Amplitude partielle (quart/demi-squat) dans la zone de force maximale des jambes — permet de charger bien au-delà du 1RM complet et de développer la force de poussée au sol utilisée en projection et en ancrage.",
    },
    {
      name: 'SDT jambes semi-tendues',
      rest: '3-4 min',
      groups: [
        {
          type: 'chauffe',
          rows: [
            { charge: '60kg', reps: '15' },
            { charge: '80kg', reps: '8' },
          ],
        },
        {
          type: 'travail',
          rows: [
            { charge: '90kg', reps: '5' },
            { charge: '95kg', reps: '5' },
            { charge: '100kg', reps: '4' },
          ],
        },
      ],
      note:
        "Jambes semi-tendues = tension continue sur la chaîne postérieure (ischios/lombaires) sans relâchement complet — renforce la posture de combat et la résistance aux tractions/déséquilibres.",
    },
    {
      name: 'Rowing lourd',
      rest: '2-3 min',
      groups: [
        { type: 'chauffe', rows: [{ charge: 'Léger', reps: '15' }] },
        {
          type: 'travail',
          rows: [
            { charge: 'Base', reps: '6' },
            { charge: '+2kg', reps: '5' },
            { charge: '+4kg', reps: '5' },
            { charge: '+6kg', reps: '4' },
          ],
        },
      ],
      note:
        "Séries montantes de +2kg : on augmente la charge à chaque série tout en acceptant une baisse progressive des reps. Construit le dos et la force de traction (saisies, contrôle au sol).",
    },
    {
      name: 'Shrugs',
      rest: '2 min',
      groups: [
        {
          type: 'travail',
          rows: [
            { charge: 'Base', reps: '6' },
            { charge: '+2kg', reps: '6' },
            { charge: '+4kg', reps: '5' },
          ],
        },
      ],
      note:
        "Renforce trapèzes et cervicales — zone critique pour l'absorption des chocs et frappes en sport de combat.",
    },
    {
      name: 'Finition',
      rest: 'Aucun — enchaîné',
      freeText: '5 min de sac de frappe + suspension à la barre (temps maximal tenu).',
      note: 'Travail de fatigue technique et de gainage de préhension en fin de séance de force.',
    },
  ],
}

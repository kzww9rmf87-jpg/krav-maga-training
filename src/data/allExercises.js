import { seanceA } from './seanceA'
import { seanceB } from './seanceB'
import { seanceC } from './seanceC'
import { seanceD } from './seanceD'
import { bras } from './bras'

export const exerciseGroups = [
  { label: 'Séance A', exercises: seanceA.exercises.map((e) => e.name) },
  { label: 'Séance B', exercises: seanceB.exercises.map((e) => e.name) },
  { label: 'Séance C', exercises: seanceC.circuit.map((e) => e.name) },
  { label: 'Séance D', exercises: seanceD.exercises.map((e) => e.name) },
  { label: 'Bras', exercises: bras.exercises.map((e) => e.name) },
]

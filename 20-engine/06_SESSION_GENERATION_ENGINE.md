# SESSION GENERATION ENGINE

## Introduction

Le Combat Athlete System ne possède pas une bibliothèque de séances figées.

Une séance est une construction temporaire.

Elle est générée pour répondre à un besoin précis identifié par le Capability Selection Engine.

Les exercices peuvent évoluer.

Les séances peuvent évoluer.

Les règles de génération restent stables.

---

# Rôle du Session Generation Engine

Le Session Generation Engine transforme une décision abstraite en une séance concrète.

Entrée :

Action Capabilities prioritaires

↓

Qualités physiques

↓

Adaptation Domains

↓

Capability Modules

Sortie :

Une séance directement réalisable.

---

# Principe fondamental

Une séance n'est jamais un objectif.

Une séance est un véhicule.

Sa seule raison d'exister est de développer les capacités identifiées comme prioritaires.

---

# Les étapes de génération

Le moteur suit toujours la même séquence.

```
Capability Selection

↓

Capability Mapping

↓

Module Selection

↓

Exercise Selection

↓

Exercise Ordering

↓

Volume Selection

↓

Session Validation
```

Chaque étape valide la précédente.

---

# Sélection des modules

Le moteur identifie les Capability Modules nécessaires.

Chaque module possède :

- une priorité ;
- une adaptation principale ;
- éventuellement plusieurs adaptations secondaires.

Les modules sont choisis pour couvrir le besoin avec le minimum de complexité.

---

# Sélection des exercices

Chaque module dispose d'une bibliothèque d'exercices compatibles.

Le moteur sélectionne ceux qui répondent le mieux au contexte.

Critères possibles :

- matériel disponible ;
- expérience ;
- limitations physiques ;
- historique récent ;
- variété.

Le moteur privilégie toujours les exercices déjà maîtrisés.

La nouveauté reste exceptionnelle.

---

# Ordonnancement

Les exercices ne sont jamais placés au hasard.

Ordre général :

Preparation

↓

Movement

↓

Power

↓

Strength

↓

Functional Hypertrophy

↓

Robustness

↓

Grip

↓

Core

↓

Conditioning

↓

Recovery

Cet ordre représente une règle du système.

Il ne dépend pas des préférences de l'utilisateur.

---

# Choix du volume

Le moteur adapte ensuite :

- nombre de séries ;
- répétitions ;
- repos ;
- durée totale.

Le volume doit toujours rester compatible avec :

- la récupération disponible ;
- le temps disponible ;
- l'objectif de la séance.

Le moteur préfère retirer un module plutôt que produire une séance trop longue.

---

# Validation

Avant d'être proposée, une séance doit satisfaire plusieurs règles.

Elle doit :

✓ poursuivre un objectif identifiable

✓ respecter les règles d'assemblage

✓ respecter la récupération

✓ rester réalisable

✓ pouvoir être expliquée

Toute séance qui ne satisfait pas ces critères est rejetée.

---

# Variabilité

Deux séances poursuivant le même objectif ne sont pas obligées d'être identiques.

Le moteur peut varier :

- les exercices ;
- les variantes ;
- les accessoires ;
- les paramètres de charge.

En revanche, la logique de génération reste identique.

---

# Philosophie

Le CAS ne cherche pas à produire la séance parfaite.

Il cherche à produire la meilleure séance possible aujourd'hui.

Une bonne séance réalisée vaut mieux qu'une séance parfaite abandonnée.

---

# Évolution

## Alpha

Séances statiques.

## Beta

Modules fixes.

## Version 1

Exercices interchangeables.

## Version 2

Volume adaptatif.

## Version 3

Séances entièrement générées.

Le Session Generation Engine évoluera progressivement.

La logique de génération restera stable.

---

# Règle finale

Une séance ne constitue jamais une unité fondamentale du Combat Athlete System.

Les unités fondamentales sont :

Mission

↓

Action Capabilities

↓

Physical Qualities

↓

Adaptation Domains

↓

Capability Modules

Les séances ne sont qu'une représentation temporaire de cette logique.
# CAPABILITY MAPPING

## Introduction

Le Combat Athlete System ne construit jamais une séance à partir d'une liste d'exercices.

Chaque séance est la conséquence d'un raisonnement.

Ce raisonnement suit toujours la même hiérarchie.

```
Mission
        ↓
Action Capability
        ↓
Physical Qualities
        ↓
Adaptation Domains
        ↓
Capability Modules
        ↓
Exercises
        ↓
Session
```

Chaque niveau existe uniquement pour servir le niveau supérieur.

Aucun niveau ne peut court-circuiter cette chaîne.

---

# Principe fondamental

Le CAS ne sélectionne jamais directement un exercice.

Il identifie d'abord la capacité d'action qui doit être développée.

Toutes les décisions suivantes sont des conséquences logiques de cette première étape.

L'exercice n'est jamais un objectif.

Il est un moyen.

---

# Les niveaux du modèle

## Mission

La mission décrit le contexte global dans lequel l'athlète souhaite devenir plus capable.

Exemples :

- Protection personnelle
- Krav Maga
- Service militaire
- Pompiers
- Rugby
- Vie quotidienne

Une même architecture peut servir plusieurs missions.

Seules les priorités changent.

---

## Action Capabilities

Les Action Capabilities décrivent ce que le corps doit être capable de faire dans le monde réel.

Elles s'expriment toujours par un verbe.

Exemples :

- Pousser
- Tirer
- Porter
- Courir
- Accélérer
- Décélérer
- Changer de direction
- Frapper
- Maintenir une prise
- Se relever

Les Action Capabilities constituent le véritable produit du CAS.

---

## Physical Qualities

Les qualités physiques représentent les moyens permettant d'améliorer les capacités d'action.

Exemples :

- Force
- Puissance
- Endurance
- Mobilité
- Robustesse
- Récupération

Une même capacité mobilise généralement plusieurs qualités.

Une même qualité contribue à plusieurs capacités.

La relation n'est jamais univoque.

---

## Adaptation Domains

Les Adaptation Domains décrivent les adaptations physiologiques recherchées.

Ils représentent la traduction biologique des qualités physiques.

Exemples :

- Maximum Strength
- Power
- Functional Hypertrophy
- Movement
- Robustness
- Conditioning
- Recovery

Ils servent de langage commun entre la science et le moteur du CAS.

---

## Capability Modules

Les Capability Modules sont les briques opérationnelles de l'entraînement.

Ils permettent de transformer une adaptation physiologique en contenu concret.

Catalogue actuel :

- Preparation
- Movement
- Power
- Strength
- Functional Hypertrophy
- Robustness
- Grip
- Core
- Conditioning
- Recovery

Un module peut contribuer à plusieurs adaptations.

Une adaptation peut être développée par plusieurs modules.

---

## Exercises

Les exercices représentent les implémentations concrètes des modules.

Ils sont volontairement interchangeables.

Le remplacement d'un exercice ne doit jamais modifier la logique du système.

Exemple :

Module Grip

↓

- Farmer Carry
- Pinch Grip
- Towel Pull-up
- Plate Hold

Le module reste identique.

Seule son implémentation évolue.

---

## Sessions

Une séance est un assemblage temporaire de Capability Modules.

Elle n'est jamais considérée comme une entité permanente.

Les séances évoluent.

Les modules restent.

---

# Exemple complet

Mission

↓

Krav Maga

↓

Action Capability

↓

Maintenir une prise malgré une résistance

↓

Physical Qualities

↓

Force

Robustesse

Endurance locale

↓

Adaptation Domains

↓

Maximum Strength

Robustness

Conditioning

↓

Capability Modules

↓

Grip

Strength

↓

Exercises

↓

Farmer Carry

Dead Hang

Towel Pull-up

↓

Session

↓

CAS 4 — Robustesse / Grip / Core

---

# Relations

Le modèle repose sur des relations de type many-to-many.

Une capacité d'action peut nécessiter plusieurs qualités physiques.

Une qualité physique peut améliorer plusieurs capacités.

Une adaptation peut servir plusieurs qualités.

Un module peut développer plusieurs adaptations.

Un exercice peut appartenir à plusieurs modules.

Une séance assemble plusieurs modules.

Le système doit rester entièrement composable.

---

# Principe de découplage

Chaque couche ne connaît que la couche immédiatement inférieure.

Exemple :

Action Capability

↓

Physical Qualities

L'Action Capability ne connaît jamais directement les exercices.

De la même manière :

Capability Module

↓

Exercises

Le module ne connaît jamais la mission de l'utilisateur.

Ce découplage garantit la stabilité de l'architecture.

Un changement dans une couche ne doit pas imposer de modification aux autres.

---

# Conséquences pour le Decision Engine

Le Decision Engine ne choisit jamais un exercice.

Il ne choisit pas directement une séance.

Son raisonnement suit toujours la chaîne complète.

```
Mission

↓

Action Capability

↓

Physical Qualities

↓

Adaptation Domains

↓

Capability Modules

↓

Exercise Repository

↓

Session Builder
```

Chaque décision est donc explicable.

Le moteur peut toujours justifier :

- pourquoi cette capacité est prioritaire ;
- pourquoi cette qualité est recherchée ;
- pourquoi cette adaptation est sélectionnée ;
- pourquoi ce module est assemblé ;
- pourquoi cet exercice est proposé.

L'explicabilité constitue un principe fondamental du Combat Athlete System.

---

# Règle d'évolution

Le modèle doit évoluer uniquement du haut vers le bas.

Une nouvelle mission peut nécessiter de nouvelles capacités.

Une nouvelle capacité peut nécessiter une nouvelle adaptation.

Une nouvelle adaptation peut nécessiter un nouveau module.

Un nouveau module peut nécessiter de nouveaux exercices.

L'inverse est interdit.

Aucun exercice ne doit être ajouté uniquement parce qu'il est populaire ou à la mode.

Toute évolution doit être justifiée par la chaîne logique complète.

Le Combat Athlete System privilégie la cohérence de son architecture à l'accumulation de fonctionnalités.
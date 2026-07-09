# CAPABILITY SELECTION ENGINE

## Introduction

Le Combat Athlete System ne choisit jamais une séance.

Il choisit d'abord ce qui mérite d'être développé.

La séance n'est que la conséquence visible d'un processus de décision beaucoup plus profond.

Le rôle du Capability Selection Engine est d'identifier, à chaque instant, les capacités d'action qui apporteront le plus de valeur à l'athlète.

---

# Principe fondamental

Le moteur ne répond jamais à la question :

> « Quelle séance vais-je faire aujourd'hui ? »

Il répond toujours à la question :

> « Quelle capacité dois-je améliorer aujourd'hui ? »

Une fois cette priorité identifiée, le reste du système construit automatiquement une séance adaptée.

---

# Hiérarchie des décisions

Toutes les décisions suivent le même ordre.

Une étape ne peut jamais contourner la précédente.

```
Sécurité

↓

Récupération

↓

Qualité du mouvement

↓

Capacités prioritaires

↓

Qualités physiques

↓

Adaptations physiologiques

↓

Capability Modules

↓

Exercices

↓

Séance
```

---

# Niveau 1 — Sécurité

Aucune progression ne justifie une augmentation inutile du risque.

Le moteur doit toujours privilégier :

- l'absence de douleur aiguë ;
- l'intégrité articulaire ;
- la qualité technique ;
- la continuité de la pratique.

Lorsqu'un conflit existe entre progression et sécurité, la sécurité gagne toujours.

---

# Niveau 2 — Récupération

La récupération est une condition préalable à toute progression.

Le moteur vérifie notamment :

- le délai depuis la dernière séance ;
- la récupération perçue ;
- la fatigue générale ;
- la qualité du sommeil (version future).

Une récupération insuffisante limite automatiquement les choix disponibles.

---

# Niveau 3 — Qualité du mouvement

Le système privilégie toujours un mouvement de qualité.

Une mauvaise qualité de mouvement ne doit jamais être compensée par davantage de charge.

Le mouvement est considéré comme un prérequis.

---

# Niveau 4 — Priorisation des Action Capabilities

Le moteur identifie les capacités d'action les plus pertinentes au regard de :

- la mission de l'utilisateur ;
- son historique récent ;
- son équilibre global ;
- les capacités peu sollicitées récemment.

Le CAS cherche un équilibre dynamique.

Il évite la spécialisation permanente.

---

# Niveau 5 — Sélection des qualités physiques

Une fois la capacité prioritaire identifiée, le moteur détermine quelles qualités physiques doivent être développées.

Une capacité mobilise généralement plusieurs qualités.

Exemple :

Action Capability

↓

Porter une charge

↓

Force

Robustesse

Conditionnement

Mouvement

---

# Niveau 6 — Sélection des Adaptation Domains

Les qualités physiques sont traduites en adaptations physiologiques.

Cette étape constitue le lien entre la théorie scientifique et l'entraînement.

Exemple :

Force

↓

Maximum Strength

---

Puissance

↓

Power

---

Robustesse

↓

Robustness

---

# Niveau 7 — Sélection des Capability Modules

Le moteur choisit ensuite les modules les plus adaptés.

Chaque module possède :

- une adaptation principale ;
- éventuellement plusieurs adaptations secondaires.

Le moteur recherche une combinaison cohérente plutôt qu'un maximum de modules.

Chaque module doit avoir une justification explicable.

---

# Niveau 8 — Sélection des exercices

Les exercices sont choisis en dernier.

Ils constituent uniquement l'implémentation concrète des modules.

Ils peuvent varier selon :

- le matériel disponible ;
- le niveau de l'utilisateur ;
- les préférences personnelles ;
- les limitations temporaires.

Le changement d'exercice ne modifie jamais la logique du système.

---

# Niveau 9 — Construction de la séance

La séance est générée à partir des modules retenus.

Elle respecte notamment :

- les règles d'assemblage des modules ;
- les contraintes de récupération ;
- le temps disponible ;
- le niveau de fatigue.

Deux séances différentes peuvent poursuivre exactement le même objectif.

---

# Explicabilité

Toutes les décisions du moteur doivent pouvoir être expliquées.

Le système doit toujours être capable de répondre aux questions suivantes :

Pourquoi cette capacité ?

Pourquoi cette qualité physique ?

Pourquoi cette adaptation ?

Pourquoi ce module ?

Pourquoi cet exercice ?

Une décision qui ne peut pas être expliquée est considérée comme invalide.

---

# Philosophie de progression

Le CAS ne cherche pas à optimiser une séance.

Il cherche à optimiser la trajectoire de progression de l'athlète.

Une séance exceptionnelle ne garantit aucune progression.

Une succession cohérente de centaines de séances, si.

Le moteur raisonne donc toujours à long terme.

---

# Ce que le moteur ne fera jamais

Le Capability Selection Engine ne choisira jamais un exercice parce qu'il est populaire.

Il ne choisira jamais une séance parce qu'elle est "la préférée" de l'utilisateur.

Il ne cherchera jamais à maximiser la fatigue.

Il ne poursuivra jamais plusieurs objectifs contradictoires au sein d'une même décision.

Il privilégiera toujours :

- la cohérence ;
- la continuité ;
- l'explicabilité ;
- la sécurité.

---

# Évolution du moteur

Le moteur est conçu pour évoluer progressivement.

## Niveau Alpha

Rotation simple entre plusieurs séances.

## Niveau Beta

Prise en compte de la récupération.

## Niveau 1.0

Sélection des capacités prioritaires.

## Niveau 2.0

Génération dynamique des modules.

## Niveau 3.0

Construction automatique des séances.

## Niveau 4.0

Personnalisation complète selon la mission, les objectifs, l'historique et les capacités de l'utilisateur.

Le comportement extérieur du CAS pourra évoluer.

Sa philosophie restera identique.

Le moteur ne choisira jamais une séance.

Il choisira toujours ce qui mérite d'être développé.
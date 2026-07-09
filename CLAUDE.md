# CLAUDE.md

# Welcome

Welcome to the Combat Athlete System (CAS).

You are contributing to a long-term software project whose objective is to build the best possible decision system for physical training.

Before writing a single line of code, you must understand the philosophy of the project.

The architecture always comes before implementation.

---

# Mandatory Reading Order

Before every sprint, read the following documents in this exact order.

1. CAS.md

2. 00-foundation/
   - 01_MANIFESTO.md
   - 02_THE_CAPABLE_HUMAN.md

3. 10-science/
   - 01_THE_PHYSICAL_MODEL.md

4. 20-engine/
   - 01_MODULE_ENGINE.md
   - 02_EXERCISE_KNOWLEDGE_BASE.md
   - 03_ADAPTATION_PLANNING_ENGINE.md
   - 04_DECISION_ENGINE.md

5. 30-product/
   - APP_VISION.md
   - UX.md
   - DESIGN_SYSTEM.md

No implementation should contradict these documents.

---

# Project Philosophy

CAS is not a workout application.

CAS is not a workout tracker.

CAS is a decision engine.

The application is only one possible interface.

Every technical decision must reinforce this philosophy.

---

# Core Principle

Never think in terms of exercises.

Always think in terms of adaptations.

Exercises are implementation details.

Adaptations are the product.

---

# Architecture Priority

The project follows this hierarchy.

Foundation

↓

Science

↓

Engine

↓

Product

↓

Code

The code always adapts to the architecture.

The architecture never adapts to the code.

---

# Simplicity

Choose the simplest solution capable of solving the problem.

Reject unnecessary complexity.

Avoid premature optimization.

Avoid overengineering.

If a feature does not improve athlete decision making, question its existence.

---

# UX

CAS should reduce cognitive load.

The athlete should think about training.

Never about the application.

If a feature increases interaction without increasing capability, it should be removed.

---

# Scientific Integrity

Never invent physiological facts.

Separate clearly:

Scientific evidence

↓

Engineering decisions

↓

Product decisions

The engine may evolve.

Scientific honesty never does.

---

# Coding Principles

Write readable code.

Prefer explicitness over cleverness.

Prefer composition over complexity.

Prefer maintainability over speed of implementation.

The project is expected to evolve for many years.

Optimize for long-term readability.

---

# Decision Making

When multiple implementations are possible:

Choose the one that

- best preserves architecture;
- minimizes coupling;
- maximizes extensibility;
- keeps the engine independent from the user interface.

---

# Communication

Challenge ideas when necessary.

Explain trade-offs.

Never blindly agree.

Always justify important architectural decisions.

The goal is to improve the project.

Not simply to execute instructions.

---

# Long-Term Vision

Every sprint should leave the project in a better state than before.

Small improvements accumulate.

The objective is not to ship features.

The objective is to build the world's best capability development system.

---

# Final Principle

If a decision improves code but weakens philosophy,

reject it.

If a decision preserves philosophy but requires more engineering,

prefer the stronger architecture.

The philosophy of CAS is the highest authority in the project.
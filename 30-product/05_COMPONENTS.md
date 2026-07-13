# COMPONENTS

Version 1.0

---

# Philosophy

Components are the building blocks of CAS.

Every component exists for a single purpose.

A component should never try to solve multiple problems.

Consistency is more important than originality.

If two components perform the same function,

they should look and behave the same.

---

# General Principles

Every component must be:

Simple.

Predictable.

Accessible.

Reusable.

Responsive.

A component should never surprise the athlete.

---

# Buttons

Buttons represent actions.

Nothing else.

Buttons should appear only when an action is available.

Avoid unnecessary buttons.

---

## Primary Button

Purpose

The single most important action on a screen.

Examples

Start Session

Continue

Finish Workout

Save

Only one Primary Button should exist on a screen.

---

## Secondary Button

Purpose

Alternative actions.

Examples

Back

Skip

Edit

Settings

Secondary buttons should never compete visually with the Primary Button.

---

## Text Button

Purpose

Low-priority actions.

Examples

Cancel

Learn More

View History

Use sparingly.

---

# Cards

Cards group related information.

They should never become containers for unrelated content.

Every card should answer one question.

Examples

Today's Recommendation

Current Exercise

Recovery Status

Weekly Summary

Cards should feel lightweight.

Never overloaded.

---

# Exercise Card

The Exercise Card is the core component of CAS.

It contains:

Exercise Name

Current Load

Repetitions

Sets

Rest Timer

Execution Notes

The athlete should understand the entire exercise in less than three seconds.

---

# Metric Card

Displays a single performance metric.

Examples

Readiness Score

Body Weight

Velocity

Heart Rate

Fatigue

One metric.

One interpretation.

Never combine unrelated metrics.

---

# Progress Bar

Purpose

Communicate progression.

Examples

Workout Progress

Recovery

Training Block

Battery

Progress bars never represent decoration.

Only measurable progress.

---

# Timers

Timers are among the most important components.

Large.

Readable.

Immediate.

The timer should dominate the screen whenever timing is critical.

Animations remain subtle.

Never distracting.

---

# Lists

Lists organize information.

Nothing more.

Every list item should have a clear purpose.

Avoid decorative separators.

Use spacing instead.

---

# Navigation Bar

Navigation should disappear into habit.

Icons remain simple.

Labels remain short.

The navigation should never require conscious thought.

---

# Bottom Sheet

Bottom Sheets provide secondary information.

Never critical information.

The athlete should complete training without opening Bottom Sheets.

---

# Dialogs

Dialogs interrupt workflow.

Use only when necessary.

Examples

Delete Session

Discard Changes

Finish Workout

Avoid confirmation dialogs when the action is reversible.

---

# Inputs

Input fields should require minimal effort.

Labels remain visible.

Error messages remain concise.

Never rely only on placeholder text.

---

# Toggles

Use Toggles only for persistent settings.

Examples

Dark Mode

Notifications

Voice Guidance

Never use toggles for immediate actions.

---

# Sliders

Use Sliders only when continuous adjustment is meaningful.

Examples

Volume

Target RPE

Sensitivity

Avoid sliders for small sets of discrete options.

---

# Graphs

Graphs support coaching decisions.

Not curiosity.

Every graph answers one practical question.

Graphs remain clean.

Minimal labels.

Minimal colors.

Maximum clarity.

---

# Badges

Badges communicate status.

Examples

Completed

Personal Best

Recovery

New

Badges should remain small.

Never become decorative.

---

# Notifications

Notifications communicate events.

Never marketing.

Examples

Workout Ready

Recovery Complete

Training Reminder

Keep notifications short.

Respect the athlete's attention.

---

# Empty States

Every empty state teaches.

Examples

No sessions completed.

No measurements yet.

No exercises available.

Instead of displaying nothing,

guide the athlete toward the next action.

---

# Loading States

Loading should reassure.

Never entertain.

Skeleton loading is preferred over spinners.

The interface should always feel responsive.

---

# Error States

Errors explain:

What happened.

Why.

What to do next.

Never blame the athlete.

Never expose technical language.

---

# Success States

Success should remain discreet.

Examples

Workout Saved

Session Completed

Personal Best Recorded

Celebrate through clarity.

Not animation.

---

# Component Consistency

Every component should behave identically wherever it appears.

Buttons.

Cards.

Timers.

Graphs.

Inputs.

Consistency reduces learning.

---

# Component Evolution

New components should only be created when an existing component cannot solve the problem.

Prefer extending existing components.

Avoid duplication.

---

# Final Principle

A component succeeds when the athlete stops noticing it.

The athlete remembers the training.

Never the interface.
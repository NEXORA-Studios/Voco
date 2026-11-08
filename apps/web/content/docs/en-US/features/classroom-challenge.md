---
title: Vocabulary sessions
description: Present a package in sequence and control which vocabulary details are revealed.
---

# Vocabulary sessions

Start a session from a package card. Voco uses that package's configured entry order and presents one entry at a time. The animated roulette is a transition while the next entry is selected; it does not independently choose a new random entry each time. To randomize the sequence, set the package sorting method to **Shuffle** and reset its order.

## Session flow

1. Start a package from the home screen.
2. Press **Space** or the session button to begin the entry animation.
3. When the animation stops, review the displayed entry and reveal or hide its available details.
4. Advance to the next entry with **Space** or the next button.
5. At the end, choose whether to restart with a sorting method or return to the package list.

The session shows a remaining-entry count. Entries missing either the source word or translation are excluded when the session starts.

## Display controls

The session controls can show or hide the source word, source description, translation, translation description, and image. Images can appear to the right of the text or in a dialog, depending on the saved display settings. The keyboard shortcuts are **C** for source, **V** for source description, **B** for translation, **N** for translation description, and **M** for image. **Space** starts or advances the session.

The session setup lets you choose the initial display settings for a launch. Display defaults are also part of application settings. Keyboard controls are ignored while focus is in an input control.

## Session order

The package order is established by its selected sorting method. **Shuffle** randomizes the package when its order is reset; **Alphabetical** uses the source word; **Original** uses the imported order. The session then advances through that sequence. Choosing a different order at completion resets the package order and returns to the package list.

## Session persistence

Voco persists session state locally so an active session can be restored after the app is reopened. The session state is separate from the vocabulary package data.

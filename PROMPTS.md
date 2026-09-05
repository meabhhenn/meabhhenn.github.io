# Prompt log — 15-113 Project 1

Tool: **Claude** (claude.ai), in conversation over several sittings.
Everything below is copy-pasted from those conversations, oldest first, with
the replies summarised where they were long. My own decisions and corrections
are the parts worth reading — see the notes in italics.

---

## Session 1 — structure and visual direction

**Me:** portfolio site for me, Meabh Hennessy, stats + ML at CMU. I want it to
look like a Mondrian collage — paper cards, off-white ground, block colours,
things very slightly rotated so it reads as cut-and-pasted paper rather than a
web template. Sections: intro, about, research and experience timeline,
projects, activities, contact.

**Claude:** proposed the layout, the paper-card treatment (cream card, ink
border, flat offset shadow, small rotation), and a type pairing.

*I chose Source Serif 4 for headings and my name, Inter for body, IBM Plex Mono
for labels and data. I rejected the first colour proposal as too saturated and
asked for pastel section fields instead: pink dots, sage stripes, mustard
checks, blue plaid, one pattern per section.*

**Me:** no dark mode, no gradient backgrounds, max two background colours per
section.

---

## Session 2 — content

**Me:** [pasted my experience: FIRST Robotics 3928 fundraising, Yu Lab research
internship, FLL Blastoff camp, 15-112 TA, chromosome-size research] put these on
a timeline, mark which awards came from which thing.

**Claude:** drafted the timeline with a shape-coded marker per kind of entry
(circle research, square teaching, triangle leadership).

**Me:** have all the timeline cards be more brief bullets. there can be many
bullets of just short things like 75+ kids and then 20+ volunteers is another.

*The first draft wrote paragraphs. I had it cut every entry to short fragments —
"$100,000+ raised across two seasons.", "110% of our goal." — which reads much
faster and is the version on the site.*

**Me:** for the skills and interests, have languages all be the same colour,
interests all the same colour, orgs all the same colour, you know, just a bit
more organised.

*My call: three labelled rows, colour-coded — languages blue, interests
mustard, orgs pink.*

---

## Session 3 — the interactive feature

**Me:** there are paper squares like 4 over the website and you can click on
them to fold the paper heart, but then when you're done folding, your paper
heart is now wherever the paper square was before. this resets when you reload.

**Me:** i mean the gum wrapper hearts, and also please don't have them appear
above any text.

*The AI's first version folded a square, and put the squares at a z-index above
the copy. I had it move every wrapper and heart to z-index 1, below the content
layer, so they cannot overlap text.*

**Me:** those are not gum wrapper ones. gum wrappers are not square shaped.

**Me:** folds: 1-4) each corner in. 5) make center crease via fold 6) undo fold
for center crease. 7) fold right half along center crease 8) fold left half
along center crease.

*This is the correction that mattered. The AI could not get the fold from a
description — I had to give it the eight-step sequence explicitly before the
geometry came out as a real gum-wrapper heart. Folds 1-4 are computed as
reflections of the paper across each crease line; from fold 5 the paper leaves
the flat plane, so those stages are authored geometry with a lift value per
layer.*

---

## Session 4 — photographs and polish

**Me:** [uploaded nine photographs] profile, soccer, chromosome size project,
phenobot, ultimate, volunteering, website, violin, mentoring.

**Me:** i want my profile picture to be a bit bigger and also for me to be a bit
bigger in the picture. no caption on the picture.

*Portrait column widened to 372px, subject scaled 1.06 inside the frame with
the transform origin high so my face stays centred, and the portrait pulled up
so it starts level with my name.*

---

## What I would tell someone starting this

The AI is fast at drafting HTML and CSS from a clear description and bad at
anything it cannot see. Layout, colour and copy came out usable on the first or
second pass. The folding sequence — a physical thing with a right answer — took
three rounds and only worked once I stopped describing it and listed the eight
folds. Knowing which of those two kinds of problem you have saves a lot of time.

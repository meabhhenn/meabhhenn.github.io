# Prompt log — 15-113 Project 1

Tool: **Claude** (claude.ai) — the chat assistant for planning and code, and
Claude's design tool for the visual work. Prompts below are copy-pasted from
those conversations, oldest first.

---

## Claude (chat) — planning and setup

> we are co brainstorming for my personal website that also has to fit these criteria [pasted the full Project 1 requirements]. My ideas so far are: 1 for theme: paper crafts where the interactive part would be origami, the background designs would be mondrian inspired etc... i don't have other ideas as of right now i guess

> What do you want to brainstorm next? → Overall page structure / file layout for coding

> i don't want content -- i want website formatting

> okay so that background should resemble my image and the content will be on top, like for team neutrino website, the content will be slightly transparent so that you can see the stuff in the background, which is mostly white. then i wonder whether having everything accessible on one screen would be best like https://bocanadas.github.io/, or whether i should have tabs where you get more information, like https://michaelsworkbench.com/

> definitely option A and closely resembling my image. can we have a draft that i can put on github

> tell me where to download and open everything appropriately

> give me a prompt to give to claude design

---

## Claude (design) — building the site

> I'm building a personal portfolio website (CMU intro web dev assignment) with a paper-craft / Mondrian collage theme. Design direction, already established:
>
> Concept: Bold Mondrian-style geometric grid, but instead of flat primary colors, each cell is a different craft/paper texture — polka dots, checkerboard, crosshatch, plaid, diagonal stripes — in soft pastel tones. One continuous illustrated collage sits fixed behind the entire page (mostly white/cream with sparse colorful pattern blocks scattered irregularly), and content sits in translucent "paper card" panels on top so the collage shows through — semi-transparent, slightly rotated (-2° to 2°), with a flat offset shadow (not blurred) like a cutout paper piece.
>
> Palette: cream #f7f3ec base, ink #2b2b28 (text/borders), soft pink #fbeaea/#e3a0a0, dusty blue #dceaf5/#8fa3d1, sage #dbe8dc/#5b8a63, mustard #f0dca8/#e0c250, plus accent lavender and coral used sparingly in the background collage.
>
> Type: Space Grotesk (display/headings), Inter (body), Caveat (handwritten accent for small labels like "hi, i'm ___").
>
> Structure: single-page scroll site, three sections — About Me (bio, photo, skills/interests tags), Projects (responsive grid: stacks on mobile, forms an asymmetric Mondrian-style grid on desktop ≥1024px), Contact (email/GitHub/LinkedIn). Sticky nav styled as small paper tabs. Dark mode toggle that flips the palette and inverts the background collage rather than just going pure black.
>
> Planned but not yet built: an interactive origami crane in the hero — drag a corner to create a fold crease, with the fold either committing or resetting.
>
> Please pick this up and help me polish the visual execution — refine the background collage composition, tighten the paper-card details, and make sure the responsive behavior (mobile → tablet → desktop) feels intentional rather than just stacked.

> please be closer to the examples i drew for you. could the cards be white, would that remain balanced? i kind of want it to be clear that the background is mondrian inspired

> okay let's revert to the original design attached below

> i want my name to be more obvious

> my name is meabh. when you hover over my first name, have a pronunciation letters and a bit of the origin (at most 1 sentence) appear

> weakest: The hero — not enough impact for a first screen, Nav — the tabs feel generic, Nothing specific, I just want more craft everywhere / crane: Yes, but somewhere quieter / project_media: Yes — real screenshots, design for images / pattern_intensity: About right / personality: Doodled arrows and circles pointing at things / grader: Internship recruiters / deliverable: Yes, at the very end

> here's what i had envisioned for the origami portion, but ask me clarifying questions

> crease_freedom: Freeform but snaps when close to a guide / drag_vs_click: drag makes the fold then crease sets it so that if you unfold there will be a crease / goal: Guided — it walks you toward an actual crane, step by step / flip: Mirrors the shape and shows a different pattern on the back / creases_visible: Folded flaps in a different colour (back of the paper), A soft shadow along each fold / mobile: Full touch support — same gestures / open: it is kind of like a sandbox. to access it, click on any of the ones that float around the cards, then a popup appears

> the crane instructions and steps are not complete; i want my name blurb hover to appear above my name when hovered. give me font and other style options (ask me questions) that match me and my resume. do not put info in yet or do anything i don't ask yet

> read_as: Statistician / researcher — precise, quantitative, credible / display_font: A humanist serif like Source Serif — academic, research-paper credible / handwriting: Drop handwriting entirely / formality: 5 / resume_link: Neither — keep it off the site / sections_wanted: Research / experience, Awards & honors

> craft_survives: Soften it — keep paper cards, make the section patterns much quieter / handwriting_replacement: Small mono — reads as data/code / doodles: Keep, but drawn more precisely / crane_fits: Keep it, but make it quieter / less prominent / research_shape: A dated timeline — role, lab, dates, bullets / awards_shape: A small grid of paper tags

> for awards i just want them to be like paper tags on the event/activity that i got them for — there wouldn't be a whole other section for them. I still want a bit more color. i don't want this to be my resume in website formatting, i want it to be interesting to interact with. i want there to be more of a timeline style for my research with hover capability to see more information about the role. the picture attached is reference, please do not follow exactly this format. definitely ask me clarifying questions. btw that is not a crane. review origami folds for a crane

> timeline_axis: option_2 / hover_reveal: Two states: a small tag always visible, full detail on hover / hover_persist: Hover to peek, click to pin / awards_attach: Tags on both research entries and project cards / color_amount: Bring back full pastel section backgrounds / interactive_extras: Nothing else — the timeline and crane are enough / crane_fidelity: Go real — add petal and reverse folds so it's a true crane, even if it's harder / crane_payoff: It joins a small flock that grows

> crane_view: Semi-3D — the paper tilts into perspective so lifted flaps actually read as lifted / crane_steps: All ~12 — the full traditional sequence / crane_difficulty: Guided, but you can free-fold after finishing / flock_where: Scattered in the section backgrounds, as part of the collage / flock_persist: No — fresh every visit / timeline_dots: Different shapes — circle for research, square for teaching, triangle for leadership / timeline_span: Evenly spaced / always_visible: An award tag if there is one / pastel_assignment: One pastel per section, as before — pink, sage, mustard, blue

> no card for contact section -- just like a standard contact section i think.. no arrow telling them to hover over my name.

> this crane has a serious problem 1) it doesn't look anything like a crane, 2) some of the folds are not intuitive in any sense. i don't want a dark option for the website. take away the crane thing in the footer. i don't like the contact section -- it's so hard to read

> for the contact section -- make there be 1 card, like a business card style, though mostly keeping the format that is there currently

> please make the contact block shorter, less vertical, just a bit more compact, not changing font size or formatting or anything

> 1) i want my picture (in the about) to be bigger, just a little bit, maybe 1.3 x current size. 2) given my resume please fill in the content, in a very understandable, but less conventional writing style; no pictures yet. 3) make the card that is my about section wider (more horizontal width b/c i think there is too much borders right now) and give more space between my name and the about me information. 4) similarly, the timeline line can span much more of the width

> 1) eventually, i want the projects section to be scrollable, and for now the names need to be a bit better, idk how but yeah 2) make the text a tad more traditional/conventional 3) i think i also want an activities section that has, very briefly, info about soccer (playing and volunteering), ultimate, first volunteering (mentoring), orchestra (maybe this can be a very short section that has just activities then 5 pictures, where upon hovering, the image gets covered by text/information about what the image is

> okay we're doing paper hearts instead of paper cranes. how it works is that there are paper squares like 4 over the website and you can click on them to fold the paper heart, but then when you're done folding, ur paper heart is now wherever the paper square was before. this resets when you reload the website.

> i mean the gum wrapper hearts, and also please don't have them appear above any text

> activities background can be the plaid one that i sent originally too. should i have the projects link to certain places? i do have pdfs of my posters and stuff. i want my profile picture to be a bit bigger and also for me to be a bit (only the very slightest itty bittiest) bigger in the picture and also note: that picture was not taken in pittsburgh. have all the timeline cards be more brief bullets. for the skills and interests, have languages all be the same color, interests all be the same colors, orgs all be the same, yk like just a bit more organized, you can put FIRST and origami and economics/finance in there too and chinese. also those are not gum wrapper ones please lock in.

> bro still not it just look up how to make a gum heart -- not that hard at all! (for 1 gum wrappers are not square shaped,) also i want the profile picture to be higher as well -- more on the level of my name. there can be many bullets for my timeline of just short things like 75+ kids and then 20+ volunteers is another, could list the five i presented at instead of saying i presented at five or whatever. lock in friend i am disappointed. just no caption on the picture

> folds: 1-4) each corner in. 5) make center crease via fold 6) undo fold for center crease. 7) fold right half along center crease 8) fold left half along center crease

> no instructions for the gum wrapper heart -- just the folding interface

> how to implement in code the proper folding pattern

> make sure i satisfy all the project requirements

> these are linked pdfs i want to pop up in a new tab similar to view the code, but like view the poster

---

## Where AI got it wrong, and what fixed it

The fold was the hard part, and it took five rounds. The AI first folded a
crane that didn't look like a crane; then a heart from a *square*, when a gum
wrapper is a rectangle; then a heart whose geometry it had checked only by
bounding-box arithmetic instead of looking at the render.

Two things from me broke the deadlock. First, I gave it the eight folds
explicitly — four corners in, centre crease, undo, then each half up along the
crease — instead of describing the result. Second, once the code was computing
the folds from a crease pattern rather than hand-drawn shapes, the remaining
bug turned out to be the wrapper's *proportion*: the same eight creases give a
wide V at 3:1 and a heart at 4.5:1, which is the ratio of a real stick-gum
wrapper. Rendering the fold at five ratios side by side and picking the one
that looked right is what finally settled it.

I also had to correct the AI on layering — it first put the paper wrappers at a
z-index above the copy, where they overlapped text. They now sit at z-index 1,
below the content layer.

## What I'd tell someone starting this

AI drafts layout, colour and copy well on the first or second pass. It is bad
at anything physical it cannot see, and worse, it will tell you the result is
correct on the strength of numbers that don't actually describe the thing you
asked about. Ask it to render and look.

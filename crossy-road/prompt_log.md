# Prompt Log — Claude (secondary AI tool)

This log covers the prompts I (Meabh) gave to **Claude**, used alongside **Kiro** (the primary AI IDE) while building Swing Set Dash. Claude was used for: reviewing/diagnosing bugs in the actual game code, translating what I wanted into precise prompts for Kiro, and verifying whether Kiro's fixes had actually been applied to the files.

> Note: this file covers the Claude side only. My in-class and other direct-to-Kiro prompts (typed straight into Kiro's chat) are tracked separately in Kiro's own history and should be added alongside this file if required.

---

1. Pasted the full CMU 15-113 HW2 assignment text and asked Claude to walk through it.
2. Answered Claude's clarifying questions about starting point: no existing code yet, but an existing portfolio website; would handle git myself.
3. "i have no code yet and i plan to do so in kiro but i want you to help me through assignment requirements"
4. Pasted a full Kiro conversation transcript and a screenshot of Kiro's output, plus my original prompt to Kiro describing the swing-set gauntlet concept and my answers to Kiro's clarifying questions, ending with: "help me prompt better, this is 1) not what swing sets look like and 2) not what i described"
5. Uploaded two reference photos of real swing sets: "kind of like this you know, not exaclt"
6. Uploaded screenshots of Kiro's (wrong) output: "bro did i open the wrong website or something?"
7. Uploaded more screenshots: "eugh"
8. Uploaded a hand-drawn sketch of the intended layout (no text).
9. "no it should be like my pictures! no random rows for the swings, they are all in the same row, i just have to time how i pass through all the swings correctly"
10. "give me a complete new prompt for kiro that i incredibly explicit ... yes you are walking ithrough the swings in that manner, timing carefully, with some spots that have no swings. BUT, the view is turned 90 degrees, as in crossy road, so it's as if you're moving forward, new drawing"
11. Answered Claude's clarifying question on swing motion: "Switch to forward-back (accurate)"
12. Answered Claude's clarifying questions on a sketch: "Just perspective doodle" and "it is forward-backward but a different perspective so that it is horizonal sweeping to the view of the character"
13. Answered Claude's clarifying question on bar shape: "Peaked/tent shape"
14. "closer, this time the character is doing the right motions, but keep all the bars and swings in line (all swings are on the same bar)"
15. "give me a new visual"
16. "YES. now the perspective is a bit offest, not entirely aerial, like in crossy road!"
17. "hype give me an explicit kiro prompt that overrides al the wrong ideas it got"
18. Uploaded a screenshot of live gameplay (score 4): "much better, but the swings need to have larger danger area covered, so aka the bar neeeds to be higher so the chains are longer. maybe too deteaild at this time, but the people and changes should be parallel to the top bar, not perpendicular"
19. Uploaded a screen recording: "lots of problems, they should all swing at different heights, the hitboxes seem to be misaligned and the triangles holding up the bar are upside down lol"
20. Uploaded a second, working screen recording (no text).
21. "well"
22. "literally looks the exact same, can you edit the code for me"
23. "next i need a prompt for: the chains need to be parallel to the bar, there needs to always be swings from the bar, but sometimes there can be no bar at all and just grass. some swings can be empty (hence not swinging) so then character has to move around them. when character gets hit, i want character to visibly show the collision and fall the the ground."
24. "also i feel like the colision boxes need to be smaller so that only when the chcaracters visibly overlap or collide is it registered as a hit. there should not be a kid in an empty swing. also in general, make teh swings have larger arcs"
25. Uploaded a screenshot of a Kiro git-lock error (no text).
26. Uploaded a screenshot of live gameplay: "some of them don't have the triangle supports. also make sure it's possible. lastly -- i could avoid everything by going around on the left or right outer edges -- have children kicking soccer balls back and forth there which you have to avoid"
27. "no just put occasional bushes there so it isn't a gurenteed highway"
28. Uploaded a screenshot of live gameplay (score 26): "first of all the the bushes aren't in the high way, and there are no soccer players/balls. 3rd the red filter that appears when you die are still here when i restart. AND the swing holders are sometimes gone still boi"
29. "take the kids with balls and their balls away and put more swingsets in so it's more like crossy road"
30. Uploaded a screenshot of the death overlay (score 8): "woah my guy -- this is only a little bet excessive. please make it 10% less dense in swing sets"
31. "the kids should never collide with each other, please make it more clear when chracter hits other or swing, make sure the hit boxes are very accurate"
32. Uploaded a screenshot of live gameplay (score 10): "why are they all like stand alone? make there be more SETS, no individual swings, though some SETS might not have people swinging on them, or only one person"
33. "they should still have wide swings/arcs -- it's in the SPACING thtat prevents them from running into each other"
34. "okay how am i coming for my assignment it'self"
35. "prompt log should be the prompts i gave you please. also last prompt -- i want the camera/view angle to be more direct -- closer to teh view of the character"

---

**AI tools used:** Kiro (primary — all game code was written/edited by Kiro), Claude (secondary — bug diagnosis, code verification via direct file review, and prompt crafting for Kiro).

# Prompts

Pattern: [one camera move] + [subject holds shape] + [lighting note] + [negatives] + [5 seconds]. Never re-describe what is already in the start image. One camera move per clip.

## Camera by type
- person: `Slow push-in toward the subject, camera moves 10 percent closer over the clip, subject holds still with subtle natural breathing, soft key light from the left, no morphing, no extra limbs, no text, 5 seconds.`
- product: `Slow 360 degree turntable rotation of the product, camera fixed at eye level, product stays perfectly sharp with no shape deformation, studio lighting with one soft highlight sweeping across the surface, seamless background, no logo warping, no new objects, 5 seconds.`
- company: `Slow camera fly-through of an abstract environment built from the brand mark, one continuous forward glide, clean geometry, one accent color, no text, no people, no flicker, 5 seconds.`
- place: `Slow walkthrough, camera glides forward through the room at walking pace, one continuous move, straight lines stay straight, natural daylight through the windows, no warping, no furniture morphing, no people, 5 seconds.`
- two photos: `One continuous camera move from the first view to the second view, steady pace, geometry stays consistent, no cuts, no morphing, 5 seconds.`

## Text-to-image (generate mode)
- product: `Studio photo of {name}, {tagline}, centered on a seamless {bg word} background, 16:9, sharp, one soft key light, no text.`
- person: `Editorial portrait of a person who is a {role}, three-quarter view, soft window light, neutral background, 16:9, no text.`
- company: `Abstract 3D still of a {one word from the brief} shape in one accent color on a dark field, 16:9, no text.`
- place: `Wide interior photo of a {place type}, natural daylight, straight verticals, 16:9, no people, no text.`

## Safe variant
If a call is flagged, drop adjectives about people, remove brand names, add `neutral, non-branded, generic`. Retry once.

## Reference image
Long edge 1536px or more. Under 720px gives mush; warn and offer to upscale.

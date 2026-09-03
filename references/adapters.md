# Adapters

One contract. Input `{prompt, startImage?, endImage?, duration: 5, ratio: "16:9", resolution: "1080p"}`. Output `source/clip.mp4` plus `source.provider`, `source.models`, `source.costUsd` in `brief.json`.

## Source modes
- **video file given**: `ffprobe` it. If longer than 8 s, keep it; `frames.sh` picks fps. Copy to `source/clip.mp4`. Cost 0.
- **one photo**: photo is the start image. Check long edge; under 1536px, upscale with the provider's upscaler if it has one (fal `fal-ai/clarity-upscaler`), else warn and continue. One image-to-video call.
- **two photos**: `startImage` and `endImage` in one call (Kling 3, Seedance 2 accept both). Prompt: "one continuous camera move from the first view to the second".
- **three or more photos**: chain pairs, 5 s each, same prompt preamble and seed if the model has one. Max 4 clips. `scripts/concat.sh source/clip.mp4 source/c1.mp4 source/c2.mp4 ...`. Cost is the sum, shown before the first call.
- **generate** (no media): text-to-image from the brief, then image-to-video with the type's camera default from `references/prompts.md`.
- **--free** or no provider with photos: `scripts/kenburns.sh source/clip.mp4 photo1 photo2 ...`. Tell the user it is a slideshow look and offer the paid path.
- **no provider and no media**: stop. Print `claude mcp add --transport http fal-ai https://mcp.fal.ai/mcp --header "Authorization: Bearer $FAL_KEY"` and `https://fal.ai/dashboard/keys`.

## Provider order when several are live
fal, Replicate, Runway, Higgsfield, Blender. Blender only when a 3D model file was given.

## Cost gate
Always show provider, models, duration, and dollars before any paid call, inside the one message. Estimates as of 2026-09-03, 5 s 1080p: fal Kling 3 Pro 0.56, fal Seedance 2.0 0.30, fal Luma Ray 3.2 1.20, fal Veo 3.1 1.00, Replicate Seedance 0.90, Runway plan credits about 0.60, Higgsfield about 0.35 raw. Add 0.05 for a text-to-image. Say "about".

## Sequences
List the tools first with the client's tool list, names can drift.

**fal MCP** (`https://mcp.fal.ai/mcp`): `search_models` for "image to video"; prefer `fal-ai/kling-video/v3/pro/image-to-video`, else `luma/agent/ray/v3.2/image-to-video`, else `fal-ai/bytedance/seedance/v2/pro/image-to-video`. `get_pricing` for the chosen id. Local image: `upload_file` first. Text-to-image: `run_model` with `fal-ai/flux-pro/v1.1`, `image_size: landscape_16_9`. Video: `submit_job` with `{image_url, prompt, duration: "5", aspect_ratio: "16:9"}` (Luma: `resolution: "1080p"`), then `check_job` every 10 s up to 10 min. Download the result URL with `curl -L -o source/clip.mp4`.

**Runway MCP** (`https://mcp.runwayml.com/mcp`): `runway_listModels`. Prefer `seedance2`, else `gen4.5` (note gen4.5 is 720p at 16:9). Image: `runway_generateImage` if listed. Video: `runway_generateVideo {promptImage, promptText, ratio: "1280:720" or the 16:9 value listed, duration: 5}`. Poll `runway_getTask`. Download `videoUri` at once; expiry is not documented.

**Higgsfield CLI**: `higgsfield generate create nano_banana_pro --prompt "..." --aspect_ratio 16:9 --wait` for the still, then `higgsfield generate create kling3_0 --prompt "..." --start-image <path> --duration 5 --aspect_ratio 16:9 --cost-only` to show cost, then the same with `--wait`. Every call deducts credits, even on unlimited plans. Output prints a media URL; download it.

**Replicate MCP**: `search_models` "image to video"; prefer `kwaivgi/kling-v3-pro` if present, else `bytedance/seedance-2`. `get_model_schema`, `create_predictions`, poll `get_prediction`, `download_files` to `source/`.

**Blender MCP** (`uvx blender-mcp`): only with a `.glb` or `.blend`. Ask Blender to import the model, add an empty at origin with the camera parented at distance 4.5, height 2.0, 50mm lens, `TRACK_TO` the model, keyframe the empty Z rotation 0 to 360 over 120 frames with linear interpolation, 5 area lights, 1920x1080, Eevee, PNG to `source/blender/`. Poll the folder until 120 files exist (the MCP call times out on long renders). Then `ffmpeg -framerate 24 -i source/blender/%04d.png -c:v libx264 -pix_fmt yuv420p source/clip.mp4`. Cost 0.

## Failure
Content flag or error: reword the prompt once using the "safe" variant in `references/prompts.md`, retry once. Then stop and report the provider message verbatim. Never retry a paid call more than once without asking.

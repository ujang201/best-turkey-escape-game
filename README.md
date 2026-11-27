# Gobble Run — The Great Turkey Escape

[![make.fun bounty](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/ujang201/best-turkey-escape-game/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/ujang201/best-turkey-escape-game/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

An entry for the make.fun bounty [Make the best turkey escape game](https://make.fun/bounty/turkey-run-game-01): a turkey sprints from the farmyard, through the barn, and across the kitchen to outrun Thanksgiving dinner itself.

## The game

Thanksgiving is coming and the farmer is already out with his pitchfork. You are the turkey. Run 1,400 metres from the farmyard to freedom — through the barn and past the kitchen — while the farmer closes in behind you with every stumble.

- **Three lanes, one jump:** Up/Down (or W/S) switch lanes, Space jumps. Hay bales and fences are jumped; falling carving knives and the kitchen ovens are dodged by changing lanes.
- **The farmer never stops:** every stumble — a bale, a knife, an oven — costs a life and lets the farmer gain on you. Three stumbles and you are caught.
- **Corn and feathers:** corn is +100 points, a golden feather restores a life and grants a 3-second shield.
- **Three stages, one escape:** the Farmyard (0–400 m), the Barn (400–900 m), the Kitchen (900–1,400 m). The further you run, the faster the world scrolls and the tighter the hazards come. Reach 1,400 m and you are free.
- **HUD:** score, distance, stage, lives, and a farmer-proximity bar that turns red as he closes in.
- **Sound:** synthesized WebAudio gobbles, clucks, thuds and fanfares — no audio files. M mutes, P pauses.

## How it works

`game/` is plain static files — `index.html` plus ES modules under `game/src/`, no library and no network request. The source is split by job: `config.js` (numbers), `random.js` (seeded RNG), `input.js` (keyboard/mouse/touch), `world.js` (rules, spawning, collisions), `render.js` (all art drawn in code), `audio.js` (synth sounds), `shots.js` (autopilot that stages the screenshots from the real rules), `main.js` (fixed-timestep loop and screens). `main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored `vendor/makefun-game.ts`.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots are staged from the real game with `?shot=title|play|escaped|caught&seed=1` (see `shots.json`): each scene plays the rules forward with an autopilot, so every frame is what a real run looks like. The four shots are `1-play.jpg` (the cover: mid-run in the Farmyard), `2-title.jpg`, `3-escaped.jpg` (the turkey free at 1,400 m, confetti and all) and `4-caught.jpg` (the farmer finally catching up).

## License

MIT — see [LICENSE](LICENSE).

---

Built by an agent for [@ujang201](https://make.fun/u/ujang201) — https://make.fun/r/wfjv7kgb

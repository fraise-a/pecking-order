# pecking order

a two-player html5 farmyard game by [fraise aurora](https://github.com/fraise-a).

## [▶ play pecking order](https://fraise-a.github.io/pecking-order/)

play as pearl, a white hen, or rusty, a russet hen. collect the most seeds in one minute. push crates, straw bales and pots to uncover hidden seeds.

## controls

| action | controls |
| --- | --- |
| player one — pearl | w, a, s, d |
| player two — rusty | arrow keys |
| pause / resume | left shift |
| leave full screen | escape (browser control) |

includes live scores, randomised seed placements, chicken sounds, touch controls, rematches and automatic pause when the tab loses focus.

## run locally

no installation or build step is required. serve the `dist` folder over http. for example, if python 3 is installed, run this from the project folder:

```sh
python3 -m http.server 8000 --directory dist
```

open [localhost:8000](http://localhost:8000) in your browser. use a local web server rather than opening the html file directly, because the game uses javascript modules.

## source files

- `dist/index.html` — game page and instructions
- `dist/style.css` — layout and styling
- `dist/game.js` — rendering, keyboard/touch controls and round interface
- `dist/game-core.js` — movement, collision handling, seeds and scoring
- `dist/audio.js` — synthesised chicken calls
- `dist/assets/` — generated chicken sprites and farmyard artwork
- `tests/collisions.test.mjs` — collision regression tests

## run the collision tests

with a recent node.js installed, run:

```sh
node --test tests/collisions.test.mjs
```

## hosting

this is a static site. publish the contents of `dist` using a static website host. a github repository stores the code; making the repository public does not by itself publish a playable website.

## credits

created by [fraise aurora](https://github.com/fraise-a), with ai-assisted code and generated artwork. chicken sounds are synthesised locally with the web audio api. the page requests dm sans and libre caslon display from google fonts, with local fallback fonts if unavailable.

# LLM enrichment

`enrich.mjs` asks Claude (`claude-opus-5`) for extra content about each of the 15 objects and saves it, so the site stays static and the API key never reaches the browser.

| # | Feature | Task name | Output |
|---|---|---|---|
| 1 | CIDOC-CRM RDF drafts from the object texts | `rdf` | `output/rdf/*.rdf`, `output/rdf/qid-check.md` |
| 2 | "Go deeper" history + geography | `deepdive` | `../llm-data.json` |
| 5 | Translations (default it, fr, es) | `translate` | `../llm-data.json` |
| 9 | Image alt text (vision) | `alt` | `../llm-data.json` |
| 10 | Then/now places and coordinates | `geo` | `../llm-data.json`, `output/objects.geojson` |

## Run

```sh
cd llm
npm install
export ANTHROPIC_API_KEY=sk-ant-...     # PowerShell: $env:ANTHROPIC_API_KEY="sk-ant-..."
node enrich.mjs --dry-run               # check what will run, no API calls
node enrich.mjs                         # everything
```

Options: `--only=alt,geo`, `--objects=1_Africa_Benin_Bronzes`, `--langs=it,de`, `--force` (regenerate existing entries), `--concurrency=4`.
Reruns skip anything already generated, so if a run fails partway, run the same command again.

Commit `../llm-data.json` with the site. `Object-page.html` loads it through `llm-content.js`. If the file is missing, the page looks the same as before.

## Review before publishing

Everything is a draft. Each entry in `llm-data.json` has `"reviewed": false`, and the page labels that content as AI-generated.
- **RDF**: the script checks every Wikidata Q-number the model used against Wikidata and lists them in `qid-check.md`, with each label next to where the draft uses it. Fix any mismatch before merging a draft into `rdf_files_graphs/`.
- **Deep dives**: check the claims against your sources, especially dates and restitution status.
- **Geo**: check the coordinates in `objects.geojson` (e.g. on geojson.io).


The two-sided perspectives on each object (feature 4) are not generated: they are researched and cited in `../perspectives.json`.

// The Stolen Archive - offline LLM enrichment.
//
// Reads ../tour-data.json (plus the Dublin Core tables in ../Items_JS_HTML),
// asks Claude for extra content per object and writes it to ../llm-data.json,
// which Object-page.html loads. Nothing here runs in the browser, so the API
// key never ships with the site.
//
//   rdf          1. CIDOC-CRM RDF/XML drafts      -> output/rdf/<object>.rdf (+ qid-check.md)
//   deepdive     2. "Go deeper" history/geography -> llm-data.json objects.<id>.deepdive
//   translate    5. it/fr/es versions of the text -> llm-data.json *.i18n.<lang>
//   (4. the two-sided perspectives are researched and cited by hand in ../perspectives.json)
//   alt          9. image alt text (vision)       -> llm-data.json objects.<id>.alt
//   geo         10. then/now places + coordinates -> llm-data.json objects.<id>.geo (+ output/objects.geojson)
//
// Usage (from this folder):
//   npm install
//   node enrich.mjs                          # every task, skipping what is already generated
//   node enrich.mjs --only=alt,geo           # some tasks
//   node enrich.mjs --objects=1_Africa_Benin_Bronzes --force
//   node enrich.mjs --langs=it,de
//   node enrich.mjs --dry-run                # list objects and planned work, no API calls
//
// Everything generated is a draft: llm-data.json marks each entry reviewed:false
// and the page labels it as AI-generated until someone flips that flag.

import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");
const OUT_JSON = path.join(ROOT, "llm-data.json");
const OUT_DIR = path.join(here, "output");
const MODEL = "claude-opus-5";

const LANG_NAMES = { it: "Italian", fr: "French", es: "Spanish", de: "German", pt: "Portuguese", el: "Greek", zh: "Chinese (Simplified)", ar: "Arabic" };
const ALL_TASKS = ["rdf", "deepdive", "alt", "geo", "translate"];

// ---------- CLI ----------

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const tasks = args.only ? String(args.only).split(",") : ALL_TASKS;
const langs = String(args.langs ?? "it,fr,es").split(",");
const onlyObjects = args.objects ? String(args.objects).split(",") : null;
const force = Boolean(args.force);
const concurrency = Number(args.concurrency ?? 4);

for (const t of tasks) if (!ALL_TASKS.includes(t)) throw new Error(`Unknown task "${t}" (expected ${ALL_TASKS.join(", ")})`);
for (const l of langs) if (!LANG_NAMES[l]) throw new Error(`Unknown language "${l}" (known: ${Object.keys(LANG_NAMES).join(", ")})`);

// ---------- source data ----------

const tourData = JSON.parse(fs.readFileSync(path.join(ROOT, "tour-data.json"), "utf8"));

// Items appear once per tour under different ids (item1...), so objects are keyed
// by their RDF file name, which is the same in every tour.
function objectIdOf(item) {
  const link = item.metadata?.["Rdf-file_link"] ?? "";
  return decodeURIComponent(link.split("/").pop() ?? "").replace(/\.rdf$/i, "");
}

const objects = {};
for (const [tourName, tour] of Object.entries(tourData)) {
  for (const itemId of tour.items) {
    const item = tour.texts[itemId];
    const id = objectIdOf(item);
    if (!id) continue;
    objects[id] ??= { id, image: item.image, table: item.metadata?.Table, tours: [] };
    objects[id].tours.push({ tourName, itemId, item });
  }
}

function stripHtml(html) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function dublinCoreText(obj) {
  if (!obj.table) return "";
  const file = path.join(ROOT, "Items_JS_HTML", decodeURIComponent(obj.table.split("/").pop()));
  return fs.existsSync(file) ? stripHtml(fs.readFileSync(file, "utf8")) : "";
}

// Everything the site already says about an object: the grounding for every prompt.
function sourceText(obj) {
  const parts = [];
  const dc = dublinCoreText(obj);
  if (dc) parts.push(`## Dublin Core metadata\n${dc}`);
  for (const { tourName, item } of obj.tours) {
    parts.push(`## ${tourName}: "${item.title}"`);
    parts.push(`Museum room: ${item.maps?.["caption-1"] ?? "?"}\nThen/now: ${item.maps?.["caption-2"] ?? "?"}`);
    // The expert/long text carries the most facts; the rest mostly repeats it.
    parts.push(item.expert?.long ?? item.basic?.long ?? "");
  }
  return parts.join("\n\n");
}

// ---------- Claude ----------

const client = new Anthropic({ maxRetries: 4 });

const SYSTEM = `You are a research assistant for "The Stolen Archive", a Digital Humanities website (University of Bologna, DHDK) about cultural objects removed from their places of origin through colonial conquest, war, or unequal agreements, and now held by museums elsewhere.

Ground rules:
- The source material you are given is the project's own vetted text. Treat it as primary.
- You may add well-established historical facts beyond it, but never invent specific dates, names, numbers, quotations or legal details. If you are not sure, leave it out.
- Provenance and ownership are contested. Attribute contested claims to whoever makes them ("The British Museum maintains...", "Nigerian authorities argue...") instead of stating them as settled fact.
- Write for a general museum audience: clear, concrete, no filler.`;

async function ask({ content, schema, effort = "high", maxTokens = 32000 }) {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    // If a safety classifier declines, re-run on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort, ...(schema && { format: { type: "json_schema", schema } }) },
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new Error(`refused (${msg.stop_details?.category ?? "no category"})`);
  if (msg.stop_reason === "max_tokens") throw new Error("hit max_tokens, output truncated");
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return schema ? JSON.parse(text) : text;
}

// Structured-output schemas must set additionalProperties:false and list every key as required.
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const str = { type: "string" };
const strList = { type: "array", items: str };

// Builds a schema with exactly the shape of `value`: used to get translations back
// in the same structure as the English original.
function schemaOf(value) {
  if (Array.isArray(value)) return { type: "array", items: value.length ? schemaOf(value[0]) : str };
  if (value && typeof value === "object") return obj(Object.fromEntries(Object.entries(value).map(([k, v]) => [k, schemaOf(v)])));
  return typeof value === "number" ? { type: "number" } : str;
}

// ---------- tasks ----------

const SCHEMAS = {
  deepdive: obj({
    history: obj({ heading: str, paragraphs: strList }),
    geography: obj({ heading: str, paragraphs: strList }),
  }),
  alt: obj({ alt: str, long_description: str }),
  geo: obj({
    origin: obj({ place: str, modern_country: str, lat: { type: "number" }, lng: { type: "number" } }),
    current: obj({ institution: str, city: str, country: str, lat: { type: "number" }, lng: { type: "number" } }),
    removal: obj({ date: str, actor: str, event: str }),
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  }),
};

const PROMPTS = {
  deepdive: (o) => `Write the "Go deeper" panel for this object: two short sections a curious visitor opens after reading the tour text.

- history: how and why the object was made, what it meant to the people who made it, and how it left its place of origin. 2-3 paragraphs.
- geography: the place it comes from (landscape, city or kingdom, trade routes, what is there today) and the journey to where it is now. 2-3 paragraphs.
Each heading is a short title, not "History"/"Geography". Don't repeat the tour text sentence by sentence; add context it doesn't have.

<source>
${sourceText(o)}
</source>`,

  alt: (o) => `This is the photo shown for the object below on its page in The Stolen Archive.

- alt: alt text for screen readers, at most 150 characters. Describe what is visible (object, material, what it depicts); don't start with "Image of" or "Photo of".
- long_description: 2-4 sentences for a longer description (visual details: form, colour, condition, setting).

Only describe what you can see; use the source text just to name things correctly.

<source>
${sourceText(o)}
</source>`,

  geo: (o) => `Extract the geography of this object's removal for a "then / now" map.

- origin: where it was made or kept before removal. place = the most specific name (site, city or kingdom), modern_country = today's country. lat/lng = decimal degrees of that place.
- current: the institution holding it now (or the main one, if it is split), with its city, country and decimal coordinates.
- removal: when (as written in the sources, e.g. "1897" or "1801-1812"), by whom, and a one-line description of the event.
- confidence: how sure you are of the coordinates and facts overall.

If the object is spread across many museums, use the one the source material names first.

<source>
${sourceText(o)}
</source>`,

  rdf: (o, example) => `Draft a CIDOC-CRM RDF/XML description of this object from its text, following the conventions of the hand-written example below (same namespaces and prefixes, CIDOC-CRM classes such as E24/E53/E39/E78, Wikidata IRIs for entities, geo:lat/geo:long on places).

Only state what the source text supports. Use a Wikidata IRI only when you are confident of the exact Q-number; otherwise mint an IRI under http://www.itemsontology.com/item_features/ as the example does. Every Q-number will be checked against Wikidata.

Reply with the RDF/XML document only, starting with <rdf:RDF and ending with </rdf:RDF>.

<example>
${example}
</example>

<source>
${sourceText(o)}
</source>`,
};

const MEDIA_TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };

// tour-data.json uses local paths (images/...), sent as base64; full URLs are passed through
function imageBlock(src) {
  if (/^https?:\/\//.test(src)) return { type: "image", source: { type: "url", url: src } };
  const file = path.join(ROOT, src);
  const media_type = MEDIA_TYPES[path.extname(file).toLowerCase()];
  if (!media_type) throw new Error(`unsupported image type: ${src}`);
  return { type: "image", source: { type: "base64", media_type, data: fs.readFileSync(file).toString("base64") } };
}

async function runObjectTask(task, o, data) {
  const entry = (data.objects[o.id] ??= {});
  if (task === "rdf") {
    const file = path.join(OUT_DIR, "rdf", `${o.id}.rdf`);
    if (fs.existsSync(file) && !force) return "skip";
    // Few-shot with a hand-written file, never the object's own (that would just be copied).
    const exampleId = o.id.includes("Parthenon") ? "1_Africa_Benin_Bronzes" : "5_Europe_The_Parthenon_Elgin_Marbles";
    const example = fs.readFileSync(path.join(ROOT, "rdf_files_graphs", `${exampleId}.rdf`), "utf8");
    let xml = (await ask({ content: PROMPTS.rdf(o, example) })).trim().replace(/^```\w*\n?|```$/g, "").trim();
    if (!xml.startsWith("<rdf:RDF") || !xml.endsWith("</rdf:RDF>")) throw new Error("reply is not an rdf:RDF document");
    xml = `<!-- AI-generated draft (${MODEL}, ${today}) from the tour texts. Review before use; see qid-check.md. -->\n${xml}\n`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, xml);
    return "ok";
  }
  if (entry[task] && !force) return "skip";
  const content = task === "alt" ? [imageBlock(o.image), { type: "text", text: PROMPTS.alt(o) }] : PROMPTS[task](o);
  entry[task] = { ...(await ask({ content, schema: SCHEMAS[task] })), reviewed: false };
  return "ok";
}

// Translates every string in `value`, returning the same structure.
async function translate(value, lang) {
  return ask({
    effort: "medium",
    schema: schemaOf(value),
    content: `Translate every string value in this JSON from English into ${LANG_NAMES[lang]}. Keep the structure and keys exactly as they are. Keep proper names, museum names and dates accurate; use the established ${LANG_NAMES[lang]} name of a place or object where one exists. Match the register of each text: the "fun" texts are playful and meant for children, "expert" texts are academic.

${JSON.stringify(value, null, 2)}`,
  });
}

const TRANSLATABLE_OBJECT_FIELDS = ["alt", "deepdive"];

function stripReviewFlags(value) {
  return JSON.parse(JSON.stringify(value, (k, v) => (k === "reviewed" ? undefined : v)));
}

async function runTranslations(o, data, lang) {
  const results = [];
  // Object-level generated content
  const entry = (data.objects[o.id] ??= {});
  const source = Object.fromEntries(TRANSLATABLE_OBJECT_FIELDS.filter((f) => entry[f]).map((f) => [f, stripReviewFlags(entry[f])]));
  entry.i18n ??= {};
  if (Object.keys(source).length && (force || !entry.i18n[lang])) {
    entry.i18n[lang] = { ...(await translate(source, lang)), reviewed: false };
    results.push("object");
  }
  // Tour texts, once per tour the object appears in
  for (const { tourName, itemId, item } of o.tours) {
    const tourEntry = ((data.tours[tourName] ??= {})[itemId] ??= { i18n: {} });
    if (tourEntry.i18n[lang] && !force) continue;
    const texts = {
      title: item.title,
      "caption-1": item.maps?.["caption-1"] ?? "",
      "caption-2": item.maps?.["caption-2"] ?? "",
      fun: item.fun,
      basic: item.basic,
      expert: item.expert,
    };
    tourEntry.i18n[lang] = { ...(await translate(texts, lang)), reviewed: false };
    results.push(tourName);
  }
  return results.length ? "ok" : "skip";
}

// ---------- post-processing ----------

async function checkQids() {
  const dir = path.join(OUT_DIR, "rdf");
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".rdf"));
  const uses = {}; // qid -> [{ file, context }]
  for (const f of files) {
    for (const line of fs.readFileSync(path.join(dir, f), "utf8").split("\n")) {
      for (const [, qid] of line.matchAll(/wikidata\.org\/(?:wiki|entity)\/(Q\d+)/g)) {
        (uses[qid] ??= []).push({ file: f, context: line.trim().slice(0, 140) });
      }
    }
  }
  const qids = Object.keys(uses);
  const labels = {};
  for (let i = 0; i < qids.length; i += 50) {
    const ids = qids.slice(i, i + 50).join("|");
    const res = await fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids}&props=labels|descriptions&languages=en&format=json`, {
      headers: { "User-Agent": "StolenArchive-DHDK/1.0 (student project)" },
    });
    const json = await res.json();
    for (const [id, ent] of Object.entries(json.entities ?? {})) {
      labels[id] = ent.missing !== undefined ? null : `${ent.labels?.en?.value ?? "(no English label)"}: ${ent.descriptions?.en?.value ?? ""}`;
    }
  }
  const lines = [
    "# Wikidata check for AI-drafted RDF",
    "",
    "Each Q-number in output/rdf/, what Wikidata says it is, and where the draft uses it.",
    "If the label doesn't match what the triple means, the model guessed the wrong ID. Fix it before using the file.",
    "",
  ];
  for (const f of files) {
    lines.push(`## ${f}`, "", "| QID | Wikidata says | Used in |", "|---|---|---|");
    for (const [qid, list] of Object.entries(uses)) {
      for (const u of list.filter((u) => u.file === f)) {
        const label = labels[qid] === null ? "**DOES NOT EXIST**" : (labels[qid] ?? "?");
        lines.push(`| ${qid} | ${label.replace(/\|/g, "/")} | \`${u.context.replace(/\|/g, "/")}\` |`);
      }
    }
    lines.push("");
  }
  fs.writeFileSync(path.join(dir, "qid-check.md"), lines.join("\n"));
  const missing = qids.filter((q) => labels[q] === null);
  console.log(`qid-check.md: ${qids.length} QIDs checked, ${missing.length} don't exist${missing.length ? ` (${missing.join(", ")})` : ""}`);
}

function writeGeojson(data) {
  const features = [];
  for (const [id, entry] of Object.entries(data.objects)) {
    const g = entry.geo;
    if (!g) continue;
    features.push({ type: "Feature", properties: { object: id, role: "origin", name: g.origin.place, removal: g.removal }, geometry: { type: "Point", coordinates: [g.origin.lng, g.origin.lat] } });
    features.push({ type: "Feature", properties: { object: id, role: "current", name: g.current.institution }, geometry: { type: "Point", coordinates: [g.current.lng, g.current.lat] } });
    features.push({ type: "Feature", properties: { object: id, role: "journey" }, geometry: { type: "LineString", coordinates: [[g.origin.lng, g.origin.lat], [g.current.lng, g.current.lat]] } });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "objects.geojson"), JSON.stringify({ type: "FeatureCollection", features }, null, 2));
}

// ---------- main ----------

const today = new Date().toISOString().slice(0, 10);
const data = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, "utf8")) : { objects: {}, tours: {} };
data.objects ??= {};
data.tours ??= {};

function save() {
  data.model = MODEL;
  data.updated = today;
  fs.writeFileSync(OUT_JSON + ".tmp", JSON.stringify(data, null, 2));
  fs.renameSync(OUT_JSON + ".tmp", OUT_JSON);
}

async function pool(jobs, n) {
  let next = 0;
  const failures = [];
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (next < jobs.length) {
        const { label, run } = jobs[next++];
        try {
          const status = await run();
          if (status !== "skip") {
            save();
            console.log(`ok    ${label}`);
          }
        } catch (err) {
          if (err instanceof Anthropic.AuthenticationError) throw err;
          const why = err instanceof Anthropic.APIError ? `API ${err.status}: ${err.message}` : err.message;
          failures.push(`${label}: ${why}`);
          console.error(`FAIL  ${label}: ${why}`);
        }
      }
    }),
  );
  return failures;
}

const selected = Object.values(objects).filter((o) => !onlyObjects || onlyObjects.includes(o.id));
if (onlyObjects && selected.length < onlyObjects.length) {
  console.error(`Unknown object id. Known ids:\n  ${Object.keys(objects).join("\n  ")}`);
  process.exit(1);
}

const objectTasks = tasks.filter((t) => t !== "translate");

if (args["dry-run"]) {
  for (const o of selected) console.log(`${o.id}  (${o.tours.length} tours, ${sourceText(o).length} chars of source text, image: ${o.image ? "yes" : "no"})`);
  console.log(`\nWould run ${objectTasks.join(", ") || "no object tasks"} on ${selected.length} objects${tasks.includes("translate") ? `, then translate into ${langs.join(", ")}` : ""}. No API calls made.`);
  process.exit(0);
}
const failures = await pool(
  selected.flatMap((o) => objectTasks.map((t) => ({ label: `${t} ${o.id}`, run: () => runObjectTask(t, o, data) }))),
  concurrency,
);
// Translation runs last so it can include the freshly generated deep dives and alt text.
if (tasks.includes("translate")) {
  failures.push(...(await pool(
    selected.flatMap((o) => langs.map((l) => ({ label: `translate:${l} ${o.id}`, run: () => runTranslations(o, data, l) }))),
    concurrency,
  )));
}

if (tasks.includes("rdf")) await checkQids();
if (tasks.includes("geo")) writeGeojson(data);
save();

console.log(failures.length ? `\nDone with ${failures.length} failure(s); rerun the same command to retry them.` : "\nDone.");

# Search: recommended design

Search design. The sorter step S5 is still to do: see [handoff.md](handoff.md). Written 2026-11-13, updated the same day for the owner's Pixel and his answers.

Today: 168 notes, 263 KB, about 3,800 lines. One FTS5 table in `.brain/index.db`. The app keeps every note in IndexedDB with a plain substring search.

## Benchmark (MacBook, Node `node:sqlite`, one row per line)

FTS5 today: query 0.06 ms, 0.7 MB. At 30 times the data: 0.7 ms, 22 MB. Trigram: 2.5 times the size, same speed.

Vector scan: 1.6 ms today, 43 ms at 30 times (int8: 1.4 MB, then 43 MB). No vector database needed for years. Model speed was not measured.

Languages: `unicode61` finds no Japanese. `trigram` finds 歯医者 but not 東京 (under 3 characters); `LIKE` finds it. Both tokenizers with `remove_diacritics` match medico to médico. `Intl.Segmenter('ja')` splits Japanese into proper words.

## The core: one shared search module

- **Units.** Index "entries": each to-do line, each dated line, each section (cut at headings, about 200 words), plus one note card. Strip `·` tokens and links before embedding. Keep subject, date, done and kind as columns.
- **Ranking.** Reciprocal rank fusion (k = 60) over three lists: words (BM25), strings (trigram on all text, for typos, part words and Japanese), meaning (cosine, English only). The name tier stays on top.
- **Answer first.** Offline, the top entry is shown as the answer card (the line, its date, its note). Paths are cited.
- **Japanese and Spanish.** Found by word and string search only, settled by the owner. Mini: the trigram table covers the body with `remove_diacritics 1`. A query under 3 characters with Japanese in it falls back to a `LIKE` scan (fast at this size). Device: MiniSearch with a custom tokenizer: `Intl.Segmenter` words plus character pairs for any Japanese run, so 2-character words match. Every term is folded to lower case without accents.
- **Code.** Chunker and ranker live in `shared/search/`, used by the engine, the app and the MCP server.

## The 5 uses

| Use | Index | Where | Updates | Speed, size |
| --- | --- | --- | --- | --- |
| 1. Find | FTS5 + trigram + vectors, fused | Mini: `index.db`. Pixel and MacBook: own copy (below) | Per write, only changed entries (hash per entry) | Under 50 ms on the mini at x30. Phone: words under 10 ms, meaning plus about 20 to 60 ms to embed the query [UNCERTAIN: not measured on the Pixel] |
| 2. Search while typing in + | Names prefix on every key; meaning after a 250 ms pause | Same copy as Find, on the device | Same | Home = vote of the subjects of the 10 nearest to-do lines, plus names typed |
| 3. Sorter | Rules, then trigram name match, then nearest-neighbour vote over sorted lines | Mini, in the pull job, Node Transformers.js | Learns from each move | Under 100 ms a capture. Unsure: best guess plus `· check` |
| 4. Connections | The `relations` table, two-hop query | Mini; phone reads relations from its notes | Per write | Under 5 ms. No vectors: the web adds no links |
| 5. Agents (MCP) | Same fused search as Find, plus a `similar` tool | Mini, inside `brain serve` | Same | Same as Find |

## The Pixel and MacBook copy

- **Format.** Notes stay in IndexedDB as today. Add a `vectors` store: entry id, hash, int8 vector. The word index is built in memory on open with MiniSearch (about 6 KB gzip, prefix and fuzzy search, custom tokenizer above).
- **Size.** Notes 0.3 MB, vectors about 1 MB today (40 MB in years), model 23 MB once, in the Cache API.
- **Sync.** The mini embeds every entry. The changes feed carries vectors for changed entries. Devices embed only the query. A new `model` stamp means fetch all vectors again.
- **Storage on the Pixel.** Install the app to the home screen and call `navigator.storage.persist()`. Chrome grants it on its own for an installed app, with no prompt.  Then only the owner can clear it. The quota is far above 70 MB.
- **Memory on the Pixel.** Chrome may kill a background tab. The model needs roughly 100 to 200 MB [UNCERTAIN: not measured], fine on a Pixel's 8 GB or more.
- **WebGPU on the Pixel.** Chrome has shipped WebGPU on Android 12+ since Chrome 121, for Mali and Adreno GPUs (Tensor G1 to G4 use Mali). [UNCERTAIN: the Pixel 10 uses a different GPU.] Use WASM: WebGPU gives little for one short query.
- **MacBook.** Same web app. In Safari, add it to the Dock to avoid Safari's 7-day wipe.
- **Why not ship `index.db`.** SQLite WASM with OPFS works in Chrome, but adds about 1 MB of code and a second copy of the text the device already holds.

## Model pick

**`Snowflake/snowflake-arctic-embed-xs`, int8 ONNX, about 23 MB, 384 numbers.** Same size as `all-MiniLM-L6-v2`, better at retrieval (about 50 versus 42 nDCG@10). It runs on WASM in Chrome and Safari, so it needs no WebGPU. The same model runs in Node on the mini, so vectors match.

Not picked: EmbeddingGemma (200 MB), Model2Vec (weaker).

**Chrome's built-in AI on the Pixel.**  On Android, only native apps reach Nano (ML Kit, AICore); a web page cannot [UNCERTAIN: may change]. Nano gives no vectors; the Embedding API is a desktop preview. So it offers nothing for search now.

**When the model is not loaded:** word search plus trigram names still work. Meaning partly works too: rank by stored vectors near the top word hit. The model loads in a worker, only on Wi-Fi.

## Engine changes, slotted into Phase 2

| # | What | Where | Fits after |
| --- | --- | --- | --- |
| S1 | Shared chunker (entries from the shared line module) and ranker (RRF, name tier) | E new `shared/search/` | 2.1 |
| S2 | Index v4: `entries` table, trigram table (`remove_diacritics 1`) on all text, short Japanese `LIKE` fallback, `vectors` table (entry id, hash, model, int8 blob). Embedder module, lazy, batch, only changed hashes. `brain index --full` rebuilds all | E `src/core/search.ts`, new `src/core/embed.ts` | S1, with 2.5 |
| S3 | Search route returns fused results and answer card. Changes feed carries vectors | E `src/interface/server-*.ts` | S2, 2.5 |
| S4 | MCP `find` and `similar` tools | E `src/interface/mcp*.ts` | S3, 2.6 |
| S5 | Sorter nearest-neighbour step | E `src/sort/` | S2, 2.11 |
| S6 | App: MiniSearch with the Japanese and accent tokenizer, vectors store, query embed in a worker, fallback, `persist()` | App `lib/notes/`, `lib/sync/`, `lib/storage/` | S3, replaces 2.12 |
| T9 | 30 real questions with the right paths, some in Japanese and Spanish, with and without accents. Pass: hybrid recall at 5 beats words only; every Japanese and Spanish one is found | E test fixtures | S3 |

## Risks

- Chrome on Android kills background tabs: the model reloads on return, a few seconds with no meaning search.
- Japanese 1-character queries (one kanji) match a lot: rank by name tier and recency.
- Word ranking on the phone (MiniSearch) differs a little from the mini (FTS5): T9 runs both.
- An uninstalled copy may be cleared when the disk is full: install the app, call `persist()`.
- The model may exceed a Worker asset's 25 MiB limit [UNCERTAIN]: serve it from the mini or Hugging Face.

## Decisions, settled by the owner (2026-11-13)

**D-S1. Model language.** Settled: English for meaning search, about 23 MB. Japanese and Spanish are found by word and string search only.

**D-S2. Word index on the device.** Settled: a light MiniSearch index built from the notes the device holds.

**D-S3. What gets a vector.** Settled: each line and section.

**D-S4. When the device fetches the model.** Settled: on its own, the first time on Wi-Fi.

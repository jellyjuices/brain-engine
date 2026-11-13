# Intent: Find

**Intent:** get any fact, to-do or note back in seconds, by words or by a plain question, anywhere.

## Problem

- Facts like a birthday, a med name or a party date are buried in notes.
- A list of file matches does not answer a plain question.

## Outcomes

1. A word search shows matching notes and to-dos in under a second.
2. Search also finds entries that mean the same thing in other words.
3. A plain question ("when is Sam's party?") gets a short answer at the top, with links to its sources.
4. To-do results can be ticked from the result list.
5. Find works anywhere, offline too, even when the home server cannot be reached.
6. Before and while the owner types, Find offers smart suggestions: recent items, likely subjects, likely kinds.

## User

The owner, when they need one fact fast, often on the phone and away from home.

## Constraints

- Find is the only place with search.
- No filter chips. Smart suggestions narrow the results.
- Results show names, never raw Markdown or link syntax.
- Word search reads the SQLite FTS5 index. Similar entries come from embeddings run inside brain. Neither needs an AI service.
- Plain-question answers come from a Claude chat until the local model runs on the home server. Answers always cite note paths.

## Open questions

1. How Find works offline. Explore a local model on the device, for example a small embedding model in the app. The migration plan settles it.

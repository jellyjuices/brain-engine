# Intent: Find

**Intent:** get any fact, to-do or note back in seconds, by words or by a plain question, anywhere.

## Problem

- Facts like a birthday, a med name or a party date are buried in notes.
- A list of file matches does not answer a plain question.

## Outcomes

1. A word search shows matching notes and to-dos in under a second.
2. Search also finds entries that mean the same thing in other words. Words and meaning work together in one list.
3. A plain question ("when is Sam's party?") gets a short answer at the top, with links to its sources.
   When the search names a subject, such as a person, that subject's card comes first. The answer comes below it.
4. To-do results can be ticked from the result list.
5. Find works anywhere, offline too, even when the home server cannot be reached.
6. Before and while the owner types, Find offers smart suggestions: recent items, likely subjects, likely kinds.

## User

The owner, when they need one fact fast, often on the phone and away from home.

## Constraints

- Find is the only place with search.
- No filter chips. Smart suggestions narrow the results.
- Results show names, never raw Markdown or link syntax.
- Word search reads the SQLite FTS5 index on the home server. It ignores accents and finds part words.
- Meaning search uses a small local embedding model, about 23 MB, run inside brain. The same model runs on the server and on the device, so results match.
- Meaning search covers English. Other languages, such as Japanese and Spanish, are found by word search only.
- Offline, the device searches its own read-only copy: a light word index plus stored meaning vectors.
- The device fetches the model on its own, the first time it is on Wi-Fi. Until it loads, word search still works.
- The phone is Android with Chrome. The app is installed to the home screen and asks for lasting storage, so Chrome does not clear it.
- No AI service is needed for search.
- Plain-question answers come from a Claude chat until the local model runs on the home server. Answers always cite note paths.

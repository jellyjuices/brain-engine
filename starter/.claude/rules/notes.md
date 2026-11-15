---
description: How to write subject notes, to-do lines, feelings and relations. Loads when you touch a note folder.
paths:
  - "areas/**"
  - "goals/**"
  - "decisions/**"
  - "projects/**"
  - "events/**"
  - "people/**"
  - "groups/**"
  - "places/**"
  - "things/**"
  - "topics/**"
  - "resources/**"
  - "me/**"
  - "journal/**"
---

# Writing notes

## Frontmatter

- `type` on every note. Allowed types, folders and fields: `.schema/types.yaml`. Allowed tags: `.schema/tags.yaml`. Add a tag there before you use it, or `brain check` fails.
- A filed note needs `title` and `description` (one line, 150 characters at most). Reason: search and lists show only these.
- `area` is the slug of a note in `areas/`. Link notes with relative Markdown links.
- File names are lowercase slugs: `projects/new-website.md`. A Person file holds first and last name: `people/sam-lee.md`.

## One file per subject

- **Pick the type with one question:** who (Person, Group), where (Place), doing (Area, Project, Event), have (Thing), know (Topic, Note), aim (Goal) or choose (Decision)?
- **A subject gets its own note at its second mention,** or when it has its own facts or to-dos. Until then, it is a linked line in the note that holds it.
- **An area note is a map.** It holds a short summary, `# See also` links, `# Now` and one-line to-dos.
- A fact about the owner goes in a lens (`me/`). A fact about a subject goes in its note. Never both. Table: `lenses.md`.
- A **goal** has `# Why`, `# Targets` (checklist lines), `# Wins` and `# Notes`. A subgoal sets `parent`, one level deep.
- A **decision** has `# Rants`, `# Buckets`, `# Options` and `# Decided`. Bits link to subjects. They are not copied.
- A **journal note**, `journal/YYYY-MM-DD-HHMM-<slug>.md`, keeps one journal entry whole. A day can have many. It has `title` (the first words, which the owner can change), `date` and `sorted` (`false` while it waits, then the day it was sorted). Never change its text. Bits sorted from it link back.

## Lines

- **To-dos** are checklist lines under `# To-dos`, in the most specific note (event, then group, thing or project, then area): `- [ ] Book the dentist · due YYYY-MM-DD`.
  - No subject: the to-do goes in General, `areas/general.md`. A to-do that only names people goes there too, with the people in `· with`.
  - Optional: `· with [Person](...)`, `· re [Subject](...)`, `· toward [Goal](../goals/<slug>.md)`.
  - Repeat: `· every month`. Rules: `every day|week|month|year`, `every 2 weeks`, `every mon`, `every weekday`, `every month on the 1st`. Add `when done` to count from the day it is done.
  - No to-do line for an event. Its `date` puts it in Today.
- **Facts** go under `# Notes`: `- YYYY-MM-DD · The office moves next year.`
- **Feelings** about a subject go under its `# Notes`, in the owner's words, with what they are about: `- YYYY-MM-DD · feeling · I like the people but the hours worry me · about the hours`. No rating. Feelings about the owner go in lenses.
- **`· from [Title](../journal/<file>.md)`** goes last on a line sorted from a journal note. It links back to that note. Keep it when you change the line.
- **`· check`** marks a line a helper was unsure of. The owner removes it when they agree.
- **Relations** go under `# People`, `# Groups`, `# Projects`, `# Places`, `# Things`, `# Topics` or `# Related`: `- [Sam](../people/sam-lee.md) · co-founder · since 2025`. Write each on one side only. Use the owner's word for the role, or leave it out.

## When tokens

| The owner picks | Line gets |
| --- | --- |
| Today | `· due <today>` |
| A date | `· due <date>` |
| Someday | `· someday` |
| Waiting on someone | `· waiting · with [Person](...)` |
| Not a to-do | a dated line under `# Notes` |

Today reads `due` only. Never write the old words (`# Open loops`, `do-now`, `schedule`, `park`, `hand-off`).

After the owner finishes a to-do, ask "What happened?" (optional). Write the answer as a dated `# Notes` line in the same note.

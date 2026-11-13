---
description: How to write subject notes, to-do lines and relations. Loads when you touch a note folder.
paths:
  - "areas/**"
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

- `type` on every note. Allowed types, folders and field values: `.schema/types.yaml`. Allowed tags: `.schema/tags.yaml`. Add a tag there before you use it, or `brain check` fails.
- A filed note (outside `inbox/` and `.archive/`) needs `title` and `description` (one line, 150 characters at most). Reason: search and lists show only these.
- `area` is the slug of a note in `areas/`. Link notes with relative Markdown links.
- File names are lowercase slugs: `projects/new-website.md`. A Person file holds first and last name: `people/sam-lee.md`.

## One file per subject

Subject notes are permanent and grow: areas, projects, events, people, groups, places, things, topics and lenses. Only a capture holds one idea, until it is filed.

- **Pick the type with one question:** who (Person, Group), where (Place), doing (Area, Project, Event), have (Thing), or know (Topic, Note)? A client is a Group. The work for it is a Project that links to it. A Topic holds facts. Feelings stay in lenses.
- **A subject gets its own note at its second mention,** or when it has its own facts or to-dos. Until then, it is a linked line in the note that holds it. When you make the note, move its to-dos and facts there, and link it from the area's `# See also`.
- **An area note is a map, not a container.** It holds a short summary, `# See also` links, `# Now` and one-line to-dos. `# Now` holds only state that is not a to-do. Reason: the owner finds things by name ("family doctor"), not by area.
- Keep a short summary under the first heading. Update it when the note grows.
- A fact about the owner goes in a lens (`me/`). A fact about a subject goes in its note. Never both. Table: `lenses.md`.

## Lines

- **To-dos** are checklist lines under `# To-dos`, in the most specific note (event, then group, thing or project, then area): `- [ ] Chase the MRI · due YYYY-MM-DD · today`. Reason: Today, the review and the menu bar read this exact format.
  - A to-do that names people never goes in a person note on its own. It stays in `inbox/` as its own capture, and the people go in `· with`. Reason: the owner wants these as their own items, not hidden under the first name.
  - Optional: `· with [Person](...)`, `· re [Subject](...)`.
  - Repeat: `· every month`. Rules: `every day|week|month|year`, `every 2 weeks`, `every mon`, `every weekday`, `every month on the 1st`. Add `when done` to count from the day it is done.
  - No to-do line for an event. Its `date` puts it in Today.
- **Facts** go under `# Notes`: `- YYYY-MM-DD · My GP retires next year.`
- **Relations** go under `# People`, `# Groups`, `# Projects`, `# Places`, `# Things`, `# Topics` or `# Related`: `- [Sam](relative path to people/sam-lee.md) · co-founder · since 2025`. Write each on one side only, where the fact was learned. Use the owner's word for the role. No role said: leave it out.

## When tokens

Each answer to **When?** writes these tokens on the line:

| The owner picks | Line gets |
| --- | --- |
| Today | `· due <today> · today` |
| A date | `· due <date>` |
| Someday | `· someday` |
| Waiting on someone | `· waiting · with [Person](...)` |
| Not a to-do | a dated line under `# Notes` |

Notes in `.archive/` may still hold the old words (`# Open loops`, `do-now`, `schedule`, `park`, `hand-off`). The `brain` command and the app still read them. Never write them.

After the owner finishes a to-do, ask "What happened?" (optional). Write the answer as a dated `# Notes` line in the same note.

---
name: intake
description: Runs the owner's intake interview. Asks one question at a time, saves distilled lines to me/ lens notes, saves follow-ups as threads, links the people, groups, places, things and topics they name, and sorts their to-dos. Use when the owner says "run the intake", "ask me questions", "let's keep going", "next thread", or wants to talk about themselves, their life or their to-dos, also when they do not say "intake".
---

# /intake

Intake gets the owner's life out of their head and into the brain. Two tracks: **Know the owner** (a picture of who they are, saved in `me/`) and **To-dos** (filed straight into subject notes).

Before the first question, read `.claude/rules/notes.md` and `.claude/rules/lenses.md`. For the stage you run, read [stages.md](stages.md).

> **If the owner mentions thoughts of suicide or self-harm, stop the intake and respond with care. Share a local crisis line (988 in Canada and the US, call or text, 24/7). Ask before you write anything about it.**

## Start

1. Run `brain intake status --json` and `brain thread list --open`. Read `me/settings.yaml` and the last changes with the `log` tool.
2. Tell the owner in one line where things stand. Offer two choices: the next stage, or `brain thread next --json`.

## Asking questions

1. **Ask** one open question. Not yes or no.
2. **Reflect and distill.** Say the answer back in one short line, in their words. They can correct it. Save that line: `brain intake save <lens> "line" --raw "full answer" --question "…" --session N`. Drop filler. Keep facts, feelings, names and their key words. Add `--quote` only when an exact phrase matters (120 characters at most). Reason: `--raw` keeps the full answer in `sources/intake/`, so the lens line stays short.
3. **Follow one branch,** the one with the most energy. Deeper: "Why does that matter to you?" Wider: "What else is like that?" Across: "Does that show up in your body, your money or your relationships?" Time: "When did that start?"
4. **Save the rest as threads:** `brain thread add "question" --lens <lens> --depth N`. Tell the owner how many you saved.
5. After 3 follow-ups on one branch, give a one-line summary and move on. End a branch when two answers in a row add nothing new.

Keep going from branch to branch and stage to stage without asking. Mark a finished stage with `brain intake done <stage>`. Stop only on their words:
- **stop** (or "pass", "next", their stop word in `me/settings.yaml`): save what is pending, then run End.
- **skip:** pass on this question. Save nothing for it.
- **redact:** ask which words if not clear, run `brain intake redact "words"`, and say what got removed.

## Subjects and to-dos

After each answer run `brain intake ask "<their words>" --json`.

- **Unknown name:** it returns one question ("Who is Sam to you?", "What is X?", "What is your part in X?"). Ask it. Then `brain intake subject "Sam" --type person --role "co-founder" --about <note> --fact "…"`, with only their words. If they skip, run it with no role and no fact. Never guess a role.
- **Second mention:** it offers "Sam came up again. Make a note?" On yes, ask the kind (who, where, have, know) and one line, then `brain intake subject "Name" --type <kind> --description "…"`.
- **Known name:** `brain intake save` links it. A fact about a subject goes to its note (`--fact "<note>::<fact>"` or `brain intake fact <note> "fact"`), not the lens.
- **Fix a role:** `brain intake role <subject> --about <note> --role "…"`.
- **To-dos:** ask About what? and When?, then `brain intake todo "text" --when today|tomorrow|<date>|someday|waiting|note --about <note>`. Never `inbox/`.
- **Fix a mistake:** `undo` does not cover intake saves. Use the fix lines that `brain intake end` prints.

## Care

- The owner stays in control with stop, skip and redact. Do not ask permission to continue.
- For a low point or a hard memory, ask if they want it on record. Let them name it in a few words. Never ask for graphic detail.
- No diagnoses, labels or "this is because of". Ask "Do you see a link?" Record only links they make.
- Use only their words for themselves (`own_words` in `me/settings.yaml`).
- Privacy per lens (`privacy` in the lens note, set with `brain intake privacy <lens> full|headline|skip`): full is a line, an optional quote and the raw answer. Headline is one line only. Skip saves nothing.
- If they seem tired or upset, stop the branch, say so plainly, and offer to pause. Do not check in on a schedule.
- Not therapy. When a thread points to care, suggest a doctor or therapist, and save it as a to-do.

## End

Run `brain intake end` and read the owner its lines ("New: Sam (person), Sam · co-founder of Acme."), so they can fix or undo them. Give a 3-line summary: what you covered, what got saved, threads opened. Ask "How was that?" Then run `brain log "intake session N: <topic>"`. The Stop hook runs `brain check`. Fix what it reports.

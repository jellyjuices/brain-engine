# Goal page spec

Source: the "Areas / Goal with two areas" story (`app/src/stories/areas-goal.stories.tsx`). The goals list, the progress bar and the step rows already match it. Two things were missing on the goal page.

## Goal page (`/goals/<goal>`)

| Where | What the owner sees | Taps | Sent |
| --- | --- | --- | --- |
| Page header | The goal's title under the "Goal" kicker. The header glow is the mix of the goal's subjects | Back arrow goes to Goals | Nothing |
| Under the title | One chip per subject, each with its own colour dot. Hidden when the goal has no subject | None, the chips only label | Nothing |
| Progress | Percent, bar in the subject mix, "N of M done", "+N this month" | None | Nothing |

Words: the chip text is the subject's name ("Health", "Fitness"). No new words.

## Goals list

No change. Each card already shows the progress bar in the subject mix.

## Mock files to delete when you approve

- `app/src/stories/areas-goal.stories.tsx`

export type StepState = {
  step: number;
  count: number;
  skipped: number[];
};

export type StepAction =
  { type: "next" } | { type: "back" } | { type: "skip" } | { type: "go"; step: number };

const clamp = (step: number, count: number) => Math.max(0, Math.min(count - 1, step));

const without = (list: number[], step: number) => list.filter((s) => s !== step);

export const startSteps = (count: number, resumeAt = 0): StepState => ({
  step: clamp(resumeAt, count),
  count,
  skipped: [],
});

export const stepReducer = (state: StepState, action: StepAction): StepState => {
  const { step, count, skipped } = state;
  switch (action.type) {
    case "next":
      return { ...state, step: clamp(step + 1, count), skipped: without(skipped, step) };
    case "skip":
      return { ...state, step: clamp(step + 1, count), skipped: [...without(skipped, step), step] };
    case "back":
      return { ...state, step: clamp(step - 1, count) };
    case "go":
      return { ...state, step: clamp(action.step, count) };
  }
};

export const isFirstStep = (state: StepState) => state.step === 0;

export const isLastStep = (state: StepState) => state.step === state.count - 1;

export const stepProgress = (state: StepState) =>
  Math.round(((state.step + 1) / state.count) * 100);

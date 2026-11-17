import { useEffect, useReducer } from "react";
import {
  isFirstStep,
  isLastStep,
  startSteps,
  stepProgress,
  stepReducer,
} from "@/lib/design/steps.ts";

export const useBuilder = (count: number, resumeAt = 0, onStepChange?: (step: number) => void) => {
  const [state, dispatch] = useReducer(stepReducer, startSteps(count, resumeAt));

  useEffect(() => {
    onStepChange?.(state.step);
  }, [state.step]);

  return {
    step: state.step,
    count: state.count,
    skipped: state.skipped,
    progress: stepProgress(state),
    first: isFirstStep(state),
    last: isLastStep(state),
    next: () => dispatch({ type: "next" }),
    back: () => dispatch({ type: "back" }),
    skip: () => dispatch({ type: "skip" }),
    go: (step: number) => dispatch({ type: "go", step }),
  };
};

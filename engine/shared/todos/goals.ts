export interface GoalStep {
  text: string;
  done: boolean;
  doneAt?: string;
  due?: string;
  path: string;
  goal: string;
  ref?: string;
}

export interface GoalWin {
  date?: string;
  text: string;
  kind: "target" | "todo";
  path: string;
  goal: string;
}

export interface GoalRef {
  path: string;
  title: string;
  status: string;
  percent: number;
  done: number;
  total: number;
}

export interface DecisionRef {
  path: string;
  title: string;
  status: string;
  decide_by?: string;
}

export interface GoalView extends GoalRef {
  description: string;
  why: string;
  areas: string[];
  parent?: string;
  recent: number;
  next?: GoalStep;
  targets: GoalStep[];
  toward: GoalStep[];
  wins: GoalWin[];
  subgoals: GoalRef[];
  decisions: DecisionRef[];
}

export const TARGETS_HEADING = "# Targets";

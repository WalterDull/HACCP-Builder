/**
 * CCP decision-tree engine — Principle 2 of the Codex Alimentarius/NACMCF
 * HACCP system.
 *
 * Implements the classic four-question Codex CCP decision tree. This exact
 * structure is mandatory verbatim for FDA seafood HACCP (21 CFR 123), FDA
 * juice HACCP (21 CFR 120), and USDA FSIS meat/poultry HACCP (9 CFR 417),
 * and is the same tree CFIA references in its guidance for Preventive
 * Control Plans under the Safe Food for Canadians Regulations (SFCR). For
 * general manufactured-food facilities under FDA's FSMA Hazard Analysis and
 * Risk-Based Preventive Controls rule (21 CFR Part 117 Subpart C, "HARPC"),
 * this tree is not a regulatory mandate but is a widely accepted way to
 * make the same CCP-vs-other-preventive-control determination consistently.
 *
 * This is decision-support, not a substitute for review/sign-off by the
 * individual(s) responsible for food safety at your facility.
 */

export type YesNo = boolean;

export interface DecisionTreeAnswers {
  /** Q1: Do control measures exist for this hazard at this or a later step? */
  q1DoControlMeasuresExist: YesNo | null;
  /** Q2: Is this step specifically designed to eliminate/reduce the hazard to an acceptable level? */
  q2IsStepSpecificallyToControl: YesNo | null;
  /** Q3: Could contamination occur at, or increase to, an unacceptable level at this step? */
  q3CouldContaminationExceedLimit: YesNo | null;
  /** Q4: Will a later step eliminate the hazard or reduce it to an acceptable level? */
  q4WillLaterStepEliminate: YesNo | null;
}

export type DecisionResult =
  | { status: "NOT_A_CCP"; reasonKey: string; reason: string; nextQuestion: null }
  | { status: "CCP"; reasonKey: string; reason: string; nextQuestion: null }
  | { status: "PRW"; reasonKey: string; reason: string; nextQuestion: null }
  | { status: "NOT_EVALUATED"; reasonKey: null; reason: null; nextQuestion: keyof DecisionTreeAnswers };

export interface QuestionGuidance {
  short: string;
  plain: string;
  help: string;
  howToDecide: string;
  yesExample: string;
  noExample: string;
  watchOut: string;
  consequence: string;
}

export const QUESTION_TEXT: Record<keyof DecisionTreeAnswers, QuestionGuidance> = {
  q1DoControlMeasuresExist: {
    short: "Do control measures exist for this hazard — at this step, or anywhere later in the process?",
    plain: "Is there anything, anywhere in your process, capable of controlling this hazard?",
    help: "Look at this step and every step after it — not just this one.",
    howToDecide:
      "A control measure is any action or activity that can prevent the hazard, eliminate it, or reduce it to an acceptable level. That includes process steps (a cook, a metal detector, a sifter, a filter) and preventive controls that live in your prerequisite programs (sanitation, allergen changeover, supplier guarantees). If any of those apply to this hazard, the answer is Yes.",
    yesExample:
      "Yes — Salmonella could be present on incoming raw poultry, and a later cook step validated to reach 74°C would destroy it.",
    noExample:
      "No — glass fragments could enter at this step, and nothing anywhere downstream (no inspection, filtration, or detection) would remove them.",
    watchOut:
      "If you answer No, don't just move on. Ask the follow-up both Codex and FDA/CFIA guidance expect: is control at this step necessary for food safety? If it is, you have a significant hazard with no control — you must modify the step, the process, or the product to introduce one. That's a process redesign, not simply a 'not a CCP' result.",
    consequence:
      "Yes → continue to Q2.  No → not a CCP as-is, and you likely need to change the process to control this hazard.",
  },
  q2IsStepSpecificallyToControl: {
    short: "Is this step specifically designed to eliminate the hazard, or reduce it to an acceptable level?",
    plain: "Was this step put into the process on purpose to deal with this specific hazard?",
    help: "Applies to processing steps only — for incoming materials, treat as not applicable (answer No) and continue to Q3.",
    howToDecide:
      "'Specifically designed' means the step exists — at least partly — to control this hazard, and you can set a measurable limit for it. Cooking, pasteurizing, metal detection, sifting, and acidification usually qualify. Mixing, receiving, storage, and packaging usually do not, even though a hazard may be present at those steps.",
    yesExample:
      "Yes — a pasteurizer designed to hold product at 72°C for 15 seconds specifically to destroy vegetative pathogens.",
    noExample:
      "No — a mixing step where pathogens may be present, but nothing about mixing is intended to reduce them.",
    watchOut:
      "Two things trip people up here. (1) This question applies to PROCESSING steps only — for incoming materials/receiving, it is 'not applicable', so answer No and continue to Q3. (2) If an SOP or prerequisite program is what actually reduces the hazard, the answer is No. The question asks whether the PROCESSING STEP ITSELF is designed to control the hazard — not whether some procedure applied around that step controls it. Also note that answering Yes ends the tree immediately at CCP, so only answer Yes if this is genuinely the best step at which to control the hazard.",
    consequence: "Yes → this step is a CCP (tree ends).  No → continue to Q3.",
  },
  q3CouldContaminationExceedLimit: {
    short: "Could contamination with this hazard occur at, or increase to, an unacceptable level at this step?",
    plain: "If your controls here failed, could this hazard reach a dangerous level at this step?",
    help: "Answer this assuming the control measure fails — that's the point of the question.",
    howToDecide:
      "This asks about contamination that exists, occurs, or increases at this step IF THE CONTROL MEASURE WERE TO FAIL. Base your answer on the product, the process, your facility's history (complaints, recalls, deviations, environmental results) and industry data — not on the assumption that everything works as intended.",
    yesExample:
      "Yes — during cooling, if the cooling rate slipped, C. perfringens spores could germinate and multiply past a safe level.",
    noExample:
      "No — product is already sealed and held frozen at this step; there is no realistic route for contamination to enter or for the hazard to grow.",
    watchOut:
      "Don't answer No just because your controls normally work — the question presumes they didn't. The standard rule of thumb applies here: if you're in doubt about how to answer, assume the worst case until you have evidence that says otherwise. When unsure, answer Yes and let Q4 resolve it.",
    consequence: "Yes → continue to Q4.  No → not a CCP at this step.",
  },
  q4WillLaterStepEliminate: {
    short: "Will a later step eliminate this hazard, or reduce it to an acceptable level?",
    plain: "Does something downstream actually fix this problem?",
    help: "Only count a later step you could genuinely validate and monitor.",
    howToDecide:
      "Look forward through the remaining steps for a real kill step or reduction step for this specific hazard — one with a critical limit you could validate, monitor, and record. A vague 'it probably gets handled later' does not count.",
    yesExample:
      "Yes — pathogens may be present at the forming step, but a later validated cook step destroys them.",
    noExample:
      "No — this is the final metal-detection point before packaging; nothing after it would remove a metal fragment.",
    watchOut:
      "If you answer Yes, this step is not the CCP — but you are now relying on that later step. Make sure it is actually evaluated through this tree and designated as a CCP with its own critical limit. The most common failure here is a hazard that quietly disappears because every step points to the next one.",
    consequence: "Yes → not a CCP at this step (the later step should be).  No → this step is a CCP.",
  },
};

/** Cross-cutting principles worth reading before working through the tree. */
export const DECISION_TREE_PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "Work one hazard, at one step, at a time",
    body: "The tree is applied separately to every significant hazard at every process step. The same hazard can be a CCP at one step and not at another — that's expected, not a contradiction.",
  },
  {
    title: "When in doubt, assume the worst",
    body: "If you can't decide how to answer a question, assume the worst-case situation until you have evidence that says otherwise. It's safer to carry a hazard further down the tree than to dismiss it early.",
  },
  {
    title: "Not everything should be a CCP",
    body: "Hazards adequately controlled by prerequisite programs (GMPs, sanitation, personal hygiene, pest control, allergen segregation, supplier guarantees) are controlled there, not as CCPs. Designating unnecessary CCPs dilutes attention from the points that genuinely keep food safe.",
  },
  {
    title: "An SOP controlling the hazard does not make the step 'designed to control it'",
    body: "This is the most common Q2 mistake. If a hazard at a step is reduced by an SOP or prerequisite program, the processing step itself was not designed to control that hazard — the SOP is doing the work. Answer No to Q2 and record the controlling SOP instead of designating a CCP.",
  },
  {
    title: "A CCP needs a measurable critical limit",
    body: "If you can't set a limit you could measure and monitor in real time (a temperature, a time, a pH, a concentration, a mesh size), the step probably isn't a true CCP.",
  },
  {
    title: "No control measure at all is a red flag",
    body: "If a significant hazard has no control anywhere in your process, the answer isn't 'not a CCP' — it's that the product or process must change so the hazard can be controlled.",
  },
  {
    title: "Write down your reasoning",
    body: "Keep the justification for each answer. Both FDA and CFIA inspectors verify that your decisions are supported, and a year from now you won't remember why you answered the way you did.",
  },
];

/**
 * Runs the answers so far through the decision tree and returns either the
 * final classification or the next question that still needs an answer.
 */
export function evaluateDecisionTree(answers: DecisionTreeAnswers): DecisionResult {
  const { q1DoControlMeasuresExist, q2IsStepSpecificallyToControl, q3CouldContaminationExceedLimit, q4WillLaterStepEliminate } =
    answers;

  if (q1DoControlMeasuresExist === null) {
    return { status: "NOT_EVALUATED", reasonKey: null, reason: null, nextQuestion: "q1DoControlMeasuresExist" };
  }

  if (q1DoControlMeasuresExist === false) {
    return {
      status: "NOT_A_CCP",
      reasonKey: "no-control-measure",
      reason:
        "No control measure exists for this hazard at this or any later step. This is not a CCP as-is — but if control at this step is necessary for food safety, you must change the process, product formulation, or intended use so the hazard can be controlled somewhere in the plan.",
      nextQuestion: null,
    };
  }

  if (q2IsStepSpecificallyToControl === null) {
    return { status: "NOT_EVALUATED", reasonKey: null, reason: null, nextQuestion: "q2IsStepSpecificallyToControl" };
  }

  if (q2IsStepSpecificallyToControl === true) {
    return {
      status: "CCP",
      reasonKey: "step-designed-to-control",
      reason:
        "This step is specifically designed to eliminate the hazard or reduce it to an acceptable level, so it is a Critical Control Point (CCP). Define a critical limit and monitoring procedure for it on the next step.",
      nextQuestion: null,
    };
  }

  if (q3CouldContaminationExceedLimit === null) {
    return { status: "NOT_EVALUATED", reasonKey: null, reason: null, nextQuestion: "q3CouldContaminationExceedLimit" };
  }

  if (q3CouldContaminationExceedLimit === false) {
    return {
      status: "NOT_A_CCP",
      reasonKey: "no-realistic-contamination-risk",
      reason:
        "Contamination with this hazard is not reasonably likely to occur or increase to an unacceptable level at this step, so it is not a CCP at this step. Make sure your justification records why — an inspector will ask.",
      nextQuestion: null,
    };
  }

  if (q4WillLaterStepEliminate === null) {
    return { status: "NOT_EVALUATED", reasonKey: null, reason: null, nextQuestion: "q4WillLaterStepEliminate" };
  }

  if (q4WillLaterStepEliminate === true) {
    return {
      status: "NOT_A_CCP",
      reasonKey: "later-step-controls",
      reason:
        "A later step will eliminate this hazard or reduce it to an acceptable level, so this step is not the CCP. Important: make sure that later step is itself evaluated through this tree and designated as a CCP — otherwise the hazard ends up controlled nowhere.",
      nextQuestion: null,
    };
  }

  return {
    status: "CCP",
    reasonKey: "no-later-control-required-now",
    reason:
      "Contamination could reach an unacceptable level here and no later step will control it, so this step is a Critical Control Point (CCP). Define a critical limit and monitoring procedure for it on the next step.",
    nextQuestion: null,
  };
}

export const QUESTION_ORDER: (keyof DecisionTreeAnswers)[] = [
  "q1DoControlMeasuresExist",
  "q2IsStepSpecificallyToControl",
  "q3CouldContaminationExceedLimit",
  "q4WillLaterStepEliminate",
];

/** Renders the answered path so far as e.g. "Q1 Yes → Q2 No → Q3 Yes". */
export function describeAnswerPath(answers: DecisionTreeAnswers): string {
  return QUESTION_ORDER.map((q, i) => {
    const v = answers[q];
    if (v === null) return null;
    return `Q${i + 1} ${v ? "Yes" : "No"}`;
  })
    .filter(Boolean)
    .join("  →  ");
}

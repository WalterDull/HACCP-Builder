"use client";

import { useState } from "react";
import {
  QUESTION_TEXT,
  DECISION_TREE_PRINCIPLES,
  type DecisionTreeAnswers,
} from "@/lib/ccpDecisionTree";

export default function DecisionTreeGuide({ nextQuestion }: { nextQuestion: keyof DecisionTreeAnswers | null }) {
  const [showPrinciples, setShowPrinciples] = useState(false);

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <button
        type="button"
        onClick={() => setShowPrinciples((s) => !s)}
        className="mb-2 text-xs font-semibold text-brand-700 hover:underline"
      >
        {showPrinciples ? "Hide" : "Show"} decision-tree principles
      </button>
      {showPrinciples && (
        <ul className="mb-3 space-y-2 border-b border-slate-100 pb-3">
          {DECISION_TREE_PRINCIPLES.map((p) => (
            <li key={p.title}>
              <p className="font-semibold text-slate-800">{p.title}</p>
              <p className="text-slate-600">{p.body}</p>
            </li>
          ))}
        </ul>
      )}
      {nextQuestion && (
        <div>
          <p className="font-semibold text-slate-800">{QUESTION_TEXT[nextQuestion].short}</p>
          <p className="mt-1 text-slate-600">{QUESTION_TEXT[nextQuestion].plain}</p>
          <p className="mt-1 text-xs text-slate-500">{QUESTION_TEXT[nextQuestion].help}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-brand-700">More guidance</summary>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>
                <span className="font-semibold">How to decide: </span>
                {QUESTION_TEXT[nextQuestion].howToDecide}
              </p>
              <p>
                <span className="font-semibold">Yes example: </span>
                {QUESTION_TEXT[nextQuestion].yesExample}
              </p>
              <p>
                <span className="font-semibold">No example: </span>
                {QUESTION_TEXT[nextQuestion].noExample}
              </p>
              <p>
                <span className="font-semibold">Watch out: </span>
                {QUESTION_TEXT[nextQuestion].watchOut}
              </p>
              <p>
                <span className="font-semibold">Consequence: </span>
                {QUESTION_TEXT[nextQuestion].consequence}
              </p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

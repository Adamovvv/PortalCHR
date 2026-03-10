import type { FormEvent } from "react";
import { ru } from "../content/ru";
import type { PortalCommunityItem, PortalQuestionAnswer } from "../types";

type QuestionDetailsPageProps = {
  question: PortalCommunityItem;
  answers: PortalQuestionAnswer[];
  answerDraft: string;
  submitting: boolean;
  onAnswerDraftChange: (value: string) => void;
  onSubmitAnswer: (event: FormEvent) => Promise<void>;
};

export function QuestionDetailsPage({
  question,
  answers,
  answerDraft,
  submitting,
  onAnswerDraftChange,
  onSubmitAnswer
}: QuestionDetailsPageProps) {
  return (
    <section className="panel panel--detail page-section">
      <div className="detail-copy">
        <h3>{question.title}</h3>
        <p>{question.body}</p>
      </div>

      <div className="detail-info-card">
        <div className="detail-info-line">
          <span>{ru.announcements.authorLabel}</span>
          <strong>{question.authorName}</strong>
        </div>
        <div className="detail-info-line">
          <span>{ru.announcements.publishedLabel}</span>
          <strong>{formatDate(question.createdAt)}</strong>
        </div>
      </div>

      <section className="panel panel--flat nested-panel">
        <div className="panel__header panel__header--stack">
          <h3>{ru.questions.answersTitle}</h3>
        </div>

        <div className="stack">
          {answers.length ? (
            answers.map((answer) => (
              <article className="content-card" key={answer.id}>
                <div className="content-card__meta">
                  <span>{answer.authorName}</span>
                  <span>{formatDate(answer.createdAt)}</span>
                </div>
                <p>{answer.body}</p>
              </article>
            ))
          ) : (
            <p className="subtle-copy subtle-copy--empty">{ru.questions.emptyAnswers}</p>
          )}
        </div>
      </section>

      <form className="editor" onSubmit={(event) => void onSubmitAnswer(event)}>
        <label className="field-block">
          <span>{ru.questions.sendAnswer}</span>
          <textarea
            rows={4}
            value={answerDraft}
            onChange={(event) => onAnswerDraftChange(event.target.value)}
            placeholder={ru.questions.answerPlaceholder}
          />
        </label>

        <div className="form-actions form-actions--end">
          <button className="primary-action" disabled={submitting} type="submit">
            {ru.questions.sendAnswer}
          </button>
        </div>
      </form>
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

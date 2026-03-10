import type { FormEvent } from "react";
import { ru } from "../content/ru";

type CreateSimplePostPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  titleValue: string;
  bodyValue: string;
  titlePlaceholder: string;
  bodyPlaceholder: string;
  submitting: boolean;
  onTitleChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: (event: FormEvent) => Promise<void>;
};

export function CreateSimplePostPage({
  eyebrow,
  title,
  subtitle,
  titleValue,
  bodyValue,
  titlePlaceholder,
  bodyPlaceholder,
  submitting,
  onTitleChange,
  onBodyChange,
  onSubmit
}: CreateSimplePostPageProps) {
  return (
    <section className="panel panel--flat page-section">
      <div className="panel__header panel__header--stack">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h3>{title}</h3>
        </div>
      </div>

      <p className="subtle-copy">{subtitle}</p>

      <form className="editor" onSubmit={(event) => void onSubmit(event)}>
        <label className="field-block">
          <span>{ru.composer.titleLabel}</span>
          <input value={titleValue} onChange={(event) => onTitleChange(event.target.value)} placeholder={titlePlaceholder} />
        </label>

        <label className="field-block">
          <span>{ru.composer.bodyLabel}</span>
          <textarea value={bodyValue} onChange={(event) => onBodyChange(event.target.value)} placeholder={bodyPlaceholder} rows={6} />
        </label>

        <div className="form-actions form-actions--end">
          <button className="primary-action" disabled={submitting} type="submit">
            {ru.composer.submit}
          </button>
        </div>
      </form>
    </section>
  );
}

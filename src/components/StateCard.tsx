import type { ReactNode } from "react";

type StateCardProps = {
  title: string;
  text: string;
  tone?: "neutral" | "danger";
  extra?: ReactNode;
};

export function StateCard({ title, text, tone = "neutral", extra }: StateCardProps) {
  return (
    <section className={`state-card ${tone === "danger" ? "state-card--danger" : ""}`}>
      <h3>{title}</h3>
      <p>{text}</p>
      {extra ?? null}
    </section>
  );
}
import type { ReactNode } from "react";
import Reveal from "./Reveal";

type Props = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
};

export default function PageHeader({ eyebrow, title, description }: Props) {
  return (
    <section className="relative overflow-hidden pt-36 pb-12 md:pt-44 md:pb-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-cream-100 to-cream-200" />
      <div className="absolute -right-32 top-10 -z-10 h-80 w-80 rounded-full bg-sage-200/40 blur-3xl" />
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-5 text-5xl leading-[1.05] tracking-tight md:text-6xl">
            {title}
          </h1>
        </Reveal>
        {description && (
          <Reveal delay={160}>
            <p className="mt-6 max-w-2xl text-lg text-ink-700/80">
              {description}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}

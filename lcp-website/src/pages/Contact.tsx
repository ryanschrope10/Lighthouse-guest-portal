import { useState, type FormEvent } from "react";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";

const team = [
  {
    name: "Josh Smith",
    role: "Capital & Operations",
    email: "josh@wearelcp.com",
    phone: "(469) 984-8503",
    photo: "/team/Josh%20Smith.webp",
  },
  {
    name: "Heather Dimmick",
    role: "Acquisitions & Construction",
    email: "heather@wearelcp.com",
    phone: "(914) 960-3338",
    photo: "/team/Heather%20Dimmick.webp",
  },
  {
    name: "Ryan Heltemes",
    role: "Acquisitions & Value-Add",
    email: "ryan@wearelcp.com",
    phone: "(360) 749-0868",
    photo: "/team/Ryan%20Heltemes.webp",
  },
  {
    name: "Heather Torres",
    role: "Investor Relations",
    email: "heather.torres@wearelcp.com",
    phone: "(360) 888-7842",
    photo: "/team/Heather%20Torres.webp",
  },
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={
          <>
            Get in touch with{" "}
            <span className="italic text-forest-700">our team.</span>
          </>
        }
        description="Whether you have a park to submit, want to invest alongside us, or just want to talk shop — we'd love to hear from you."
      />

      <section className="section pt-0">
        <div className="container-narrow">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {team.map((p, i) => (
              <Reveal key={p.email} delay={i * 80}>
                <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink-700/5 bg-cream-50 transition-all duration-500 hover:-translate-y-1 hover:shadow-glow">
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-sage-200 to-clay-300/60">
                    <img
                      src={p.photo}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-lg text-ink-900">
                      {p.name}
                    </h3>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-clay-500">
                      {p.role}
                    </div>
                    <div className="mt-5 space-y-2 text-sm">
                      <a
                        href={`mailto:${p.email}`}
                        className="block break-all text-ink-700 transition-colors hover:text-forest-700"
                      >
                        {p.email}
                      </a>
                      <a
                        href={`tel:${p.phone.replace(/\D/g, "")}`}
                        className="block text-ink-700 transition-colors hover:text-forest-700"
                      >
                        {p.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-narrow">
          <div className="grid gap-10 rounded-4xl border border-ink-700/10 bg-cream-50 p-8 shadow-soft md:p-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <span className="eyebrow">Send us a message</span>
              <h2 className="mt-4 text-4xl leading-tight md:text-5xl">
                Tell us how we can help.
              </h2>
              <p className="mt-5 text-base text-ink-700/80">
                We typically respond within one business day. For time-sensitive
                deals, please include the asking price and location in your
                message.
              </p>
              <ul className="mt-10 space-y-4 text-sm">
                <li className="flex items-center gap-3 text-ink-700">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-200 text-forest-800">
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                      <path d="M2.94 4.06A2 2 0 015 3h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 01-.06-.94zM4 6v.01L10 11l6-4.99V5H4v1z" />
                    </svg>
                  </span>
                  <a href="mailto:hello@wearelcp.com" className="hover:text-forest-700">
                    hello@wearelcp.com
                  </a>
                </li>
                <li className="flex items-center gap-3 text-ink-700">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-300/60 text-ink-900">
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                      <path d="M2 4a2 2 0 012-2h2.28a2 2 0 011.93 1.45l.7 2.45a2 2 0 01-.5 2L7.2 9.3a11 11 0 003.5 3.5l1.4-1.2a2 2 0 012-.5l2.45.7A2 2 0 0118 13.72V16a2 2 0 01-2 2h-1C7.82 18 2 12.18 2 5V4z" />
                    </svg>
                  </span>
                  <a href="tel:+14699848503" className="hover:text-forest-700">
                    (469) 984-8503
                  </a>
                </li>
              </ul>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-7">
              {submitted ? (
                <div className="flex h-full flex-col items-center justify-center rounded-3xl bg-forest-800 p-10 text-center text-cream-100">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-100/10">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="mt-6 font-display text-3xl text-cream-50">
                    Message received.
                  </h3>
                  <p className="mt-4 max-w-sm text-sm text-cream-100/70">
                    Thanks for reaching out. Someone from our team will get back
                    to you within one business day.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="label">Name</label>
                    <input type="text" className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input-field" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">I&apos;m reaching out about</label>
                    <select className="input-field" defaultValue="">
                      <option value="" disabled>
                        Select a topic
                      </option>
                      <option>Submitting a park</option>
                      <option>Investing with you</option>
                      <option>Joining the training waitlist</option>
                      <option>Something else</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Message</label>
                    <textarea
                      rows={5}
                      className="input-field"
                      placeholder="Tell us a bit about what you're looking for…"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-end">
                    <button type="submit" className="btn-primary">
                      Send Message
                    </button>
                  </div>
                </form>
              )}
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

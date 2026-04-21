import { Link } from "react-router-dom";
import Reveal from "../components/Reveal";
import { useState } from "react";

const assets = [
  {
    title: "RV Parks",
    desc: "Well-located parks with strong demand and stable long-term tenants.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
        <path
          d="M6 30h30v8H10a4 4 0 0 1-4-4v-4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M36 22h4l4 6v6h-8V22Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="38" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="36" cy="38" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M10 30V18h22v12" stroke="currentColor" strokeWidth="2" />
        <path d="M16 24h6" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: "Mobile Home Communities",
    desc: "Affordable housing assets serving long-term residents in growing markets.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
        <path
          d="M8 24 24 12l16 12v14a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V24Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M18 40V28h12v12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M4 24h40" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: "Value-Add Opportunities",
    desc: "Underperforming parks with clear paths to improved operations and NOI.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
        <path
          d="M8 36 20 22l8 8 12-16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M30 14h10v10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M6 40h36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Long-Term Properties",
    desc: "Stabilized assets held for durable cash flow and generational wealth.",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8">
        <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2" />
        <path
          d="M24 14v10l6 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M24 6v2M24 40v2M6 24h2M40 24h2" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
];

const buyBox = [
  {
    k: "Purchase Price",
    v: "$4M – $10M+",
    detail: "Core acquisition sweet spot with room for larger deals.",
  },
  {
    k: "Location",
    v: "Landlord-Friendly States",
    detail: "Primary focus on Texas and Idaho with select Mountain West and Southeast markets.",
  },
  {
    k: "Size",
    v: "50+ Sites",
    detail: "Parks with 50 or more RV sites or mobile home pads for operational efficiency.",
  },
  {
    k: "RV Park Returns",
    v: "10%+ Cap Rate",
    detail: "In-place or clear path to a 10%+ cap within six months of takeover.",
  },
  {
    k: "MHP Returns",
    v: "7%+ Cap Rate",
    detail: "Mobile home communities underwritten at 7% or better.",
  },
  {
    k: "Tenant Profile",
    v: "Long-Term Residents",
    detail: "Long-term preferred; transient revenue as a secondary stream.",
  },
  {
    k: "Infrastructure",
    v: "City Utilities Preferred",
    detail: "Or strong, well-maintained private systems with clean records.",
  },
  {
    k: "Value Add",
    v: "NOI Upside",
    detail: "Operational improvements, occupancy gains, and rent alignment.",
  },
  {
    k: "Deal Structure",
    v: "Creative & Flexible",
    detail: "Open to seller financing, partnerships, and creative terms.",
  },
];

const team = [
  {
    name: "Josh Smith",
    role: "Capital & Operations",
    bio: "Seasoned real estate investor and operator with a strong track record as a capital source and transactional lender. Owns and operates a property management company, bringing hands-on operational expertise to every deal.",
    photo: "/team/Josh%20Smith.webp",
  },
  {
    name: "Heather Dimmick",
    role: "Acquisitions & Construction",
    bio: "30+ years as a real estate investor, operator, and general contractor. Overseen 1,800+ units and led multimillion-dollar renovations across multifamily and mixed-use properties.",
    photo: "/team/Heather%20Dimmick.webp",
  },
  {
    name: "Ryan Heltemes",
    role: "Acquisitions & Value-Add",
    bio: "10+ years revitalizing underperforming properties through disciplined underwriting, hands-on management, and strategic capital improvements. Applies the same rigor to RV/MH park acquisitions.",
    photo: "/team/Ryan%20Heltemes.webp",
  },
  {
    name: "Heather Torres",
    role: "Investor Relations",
    bio: "10+ years in marketing, operations, and growth. Supports acquisitions and works closely with investment partners through clear, consistent communication and scalable operating systems.",
    photo: "/team/Heather%20Torres.webp",
  },
];

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 lg:pt-44 lg:pb-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cream-100 via-cream-100 to-cream-200" />
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-sage-200/40 blur-3xl" />
        <div className="absolute -right-32 top-60 h-96 w-96 rounded-full bg-clay-300/30 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-12 lg:gap-10 lg:px-10">
        <div className="lg:col-span-7 lg:pt-6">
          <Reveal>
            <span className="eyebrow">Investing in</span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 text-5xl font-medium leading-[1.05] tracking-tight text-ink-900 md:text-6xl lg:text-7xl">
              RV Parks &amp;{" "}
              <span className="italic text-forest-700">Mobile Home</span>{" "}
              Communities
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-ink-700/80">
              We partner with owners, brokers, and investors to acquire and
              operate cash-flowing parks across the United States. Stable
              assets, disciplined operations, long-term value.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/submit" className="btn-primary">
                Submit a Park
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path
                    d="M4 10h12m0 0-4-4m4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link to="/invest" className="btn-secondary">
                Invest With Us
              </Link>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-ink-700/10 pt-8">
              <div>
                <dt className="text-xs uppercase tracking-widest text-clay-500">
                  Buy Box
                </dt>
                <dd className="mt-1 font-display text-2xl text-ink-900">
                  $4–10M+
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-clay-500">
                  Target IRR
                </dt>
                <dd className="mt-1 font-display text-2xl text-ink-900">~17%</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-clay-500">
                  Focus
                </dt>
                <dd className="mt-1 font-display text-2xl text-ink-900">TX · ID</dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <div className="relative lg:col-span-5">
          <Reveal delay={200} className="relative">
            <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-4xl bg-gradient-to-br from-forest-700 to-forest-900 p-1 shadow-glow">
              <div className="relative h-full w-full overflow-hidden rounded-[calc(2rem-4px)] bg-forest-800">
                <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_30%_20%,#9BAE92_0%,transparent_50%),radial-gradient(circle_at_70%_80%,#C89B77_0%,transparent_50%)]" />
                <div className="absolute inset-0 flex flex-col justify-between p-8 text-cream-100">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-cream-100/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur">
                      Portfolio
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-cream-100/60">
                      Active
                    </span>
                  </div>
                  <div>
                    <div className="font-display text-5xl">17%</div>
                    <p className="mt-1 text-sm text-cream-100/70">
                      Target investor IRR across the portfolio
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-cream-100/15 pt-6">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-cream-100/50">
                          Sites Operated
                        </div>
                        <div className="mt-1 font-display text-xl">1,800+</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-cream-100/50">
                          Years Experience
                        </div>
                        <div className="mt-1 font-display text-xl">30+</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-6 top-10 hidden rounded-2xl bg-cream-50 p-4 shadow-soft animate-float md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-200 text-forest-800">
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
                    <path d="M10 2a1 1 0 0 1 .894.553l2.382 4.824 5.324.774a1 1 0 0 1 .554 1.706l-3.853 3.756.91 5.303a1 1 0 0 1-1.451 1.054L10 17.347l-4.76 2.623a1 1 0 0 1-1.451-1.054l.91-5.303-3.853-3.756a1 1 0 0 1 .554-1.706l5.324-.774L9.106 2.553A1 1 0 0 1 10 2Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-clay-500">
                    10%+ Cap
                  </div>
                  <div className="text-sm font-semibold text-ink-900">
                    RV Park Returns
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-10 hidden rounded-2xl bg-cream-50 p-4 shadow-soft animate-float [animation-delay:-3s] md:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-300/60 text-ink-900">
                  <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 17 9 11l4 4 5-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-clay-500">
                    NOI Growth
                  </div>
                  <div className="text-sm font-semibold text-ink-900">
                    Value-Add Playbook
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function AssetClasses() {
  return (
    <section id="what-we-buy" className="section">
      <div className="container-narrow">
        <Reveal>
          <span className="eyebrow">What We Buy</span>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">
            Four asset types we actively acquire.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {assets.map((a, i) => (
            <Reveal key={a.title} delay={i * 80}>
              <div className="group h-full rounded-3xl border border-ink-700/5 bg-cream-50 p-7 transition-all duration-500 hover:-translate-y-1 hover:border-forest-600/30 hover:shadow-glow">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-200 text-forest-800 transition-colors group-hover:bg-forest-700 group-hover:text-cream-100">
                  {a.icon}
                </div>
                <h3 className="mt-6 font-display text-xl text-ink-900">
                  {a.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-700/75">
                  {a.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuyBox() {
  const [active, setActive] = useState(0);
  return (
    <section className="section bg-cream-200/60">
      <div className="container-narrow">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">Our Buy Box</span>
            <h2 className="mt-4 text-4xl leading-tight md:text-5xl">
              The parks we actively acquire.
            </h2>
            <p className="mt-5 text-lg text-ink-700/75">
              Clear criteria. Quick decisions. If your deal fits, we move fast
              with transparency at every step.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <Link to="/submit" className="btn-primary">
              Submit Your Park
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-3 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <ul className="divide-y divide-ink-700/10 overflow-hidden rounded-3xl border border-ink-700/10 bg-cream-50">
              {buyBox.map((b, i) => (
                <li key={b.k}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors ${
                      active === i
                        ? "bg-forest-700 text-cream-50"
                        : "hover:bg-cream-200/70"
                    }`}
                  >
                    <div>
                      <div
                        className={`text-[11px] font-semibold uppercase tracking-widest ${
                          active === i ? "text-clay-300" : "text-clay-500"
                        }`}
                      >
                        {b.k}
                      </div>
                      <div
                        className={`mt-0.5 font-display text-lg ${
                          active === i ? "text-cream-50" : "text-ink-900"
                        }`}
                      >
                        {b.v}
                      </div>
                    </div>
                    <svg
                      viewBox="0 0 16 16"
                      className={`h-4 w-4 transition-transform ${
                        active === i ? "translate-x-1" : "opacity-40"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M5 3l5 5-5 5" strokeLinecap="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <Reveal className="lg:col-span-7" delay={80}>
            <div className="relative h-full min-h-[340px] overflow-hidden rounded-3xl bg-forest-800 p-10 text-cream-100">
              <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_80%_20%,#9BAE92_0%,transparent_50%),radial-gradient(circle_at_10%_90%,#C89B77_0%,transparent_50%)]" />
              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-clay-300">
                    {buyBox[active].k}
                  </span>
                  <h3 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
                    {buyBox[active].v}
                  </h3>
                  <p className="mt-6 max-w-md text-base leading-relaxed text-cream-100/80">
                    {buyBox[active].detail}
                  </p>
                </div>
                <div className="mt-10 flex items-center justify-between border-t border-cream-100/10 pt-6">
                  <div className="text-xs uppercase tracking-widest text-cream-100/50">
                    Criterion {String(active + 1).padStart(2, "0")} /{" "}
                    {String(buyBox.length).padStart(2, "0")}
                  </div>
                  <Link
                    to="/submit"
                    className="text-xs font-semibold uppercase tracking-widest text-clay-300 hover:text-cream-50"
                  >
                    Submit a deal →
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function WorkWithUs() {
  const cards = [
    {
      tag: "Sellers & Brokers",
      title: "Submit a Park",
      body: "Have an RV park or mobile home community for sale? Send it directly to our acquisitions team for fast, transparent review.",
      to: "/submit",
      cta: "Submit a Deal",
    },
    {
      tag: "Investors",
      title: "Partner With Capital",
      body: "Invest alongside an experienced team actively acquiring and operating parks. Access off-market opportunities with aligned incentives.",
      to: "/invest",
      cta: "Invest With Us",
    },
    {
      tag: "Operators",
      title: "Learn From Our Team",
      body: "Free upcoming training for park operators and aspiring investors. Join the waitlist to learn our acquisition and operating playbook.",
      href: "https://docs.google.com/forms/d/e/1FAIpQLSfpS-yu6dBAlyD3dlusPzcIsn99e0pRxSijHcg-h9t0XBRR_w/viewform?usp=header",
      cta: "Join the Waitlist",
    },
  ];
  return (
    <section className="section">
      <div className="container-narrow">
        <Reveal>
          <span className="eyebrow">Work With Us</span>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">
            Choose how you&apos;d like to connect.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 100}>
              <div className="group flex h-full flex-col rounded-3xl border border-ink-700/5 bg-cream-50 p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-glow">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-clay-500">
                  {c.tag}
                </span>
                <h3 className="mt-4 font-display text-2xl text-ink-900">
                  {c.title}
                </h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-700/75">
                  {c.body}
                </p>
                {c.to ? (
                  <Link
                    to={c.to}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-forest-700 transition-colors group-hover:text-clay-600"
                  >
                    {c.cta}
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                ) : (
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-forest-700 transition-colors group-hover:text-clay-600"
                  >
                    {c.cta}
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function InvestBand() {
  return (
    <section className="section">
      <div className="container-narrow">
        <div className="grid items-center gap-12 rounded-4xl bg-forest-700 px-8 py-14 text-cream-100 shadow-glow md:px-14 md:py-20 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-clay-300">
                Invest With Us
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-4 text-4xl leading-tight text-cream-50 md:text-5xl">
                Build generational wealth alongside an operator-led team.
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-cream-100/80">
                <p>
                  We partner with investors to acquire and operate RV parks and
                  mobile home communities with strong long-term fundamentals.
                  Our focus is on well-located parks with clear opportunities to
                  improve operations, increase income, and create value.
                </p>
                <p>
                  As a capital partner, you gain access to carefully sourced
                  deals and the ability to invest alongside a team actively in
                  the trenches. We believe in transparency, aligned incentives,
                  and partnerships that compound over multiple deals.
                </p>
              </div>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/invest"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cream-100 px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-forest-900 transition-all hover:-translate-y-0.5 hover:bg-cream-50"
                >
                  Invest With Us
                </Link>
                <a
                  href="https://drive.google.com/file/d/1k809MMimB6JltD3JKSZeN_dycLRzPXNT/view?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-cream-100/30 px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-cream-100 transition-all hover:border-cream-100 hover:-translate-y-0.5"
                >
                  View Portfolio
                </a>
              </div>
            </Reveal>
          </div>
          <Reveal delay={200} className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { k: "~17%", v: "Target IRR" },
                { k: "1,800+", v: "Units Operated" },
                { k: "30+", v: "Years Experience" },
                { k: "LP · PML · PE", v: "Flexible Structures" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-2xl border border-cream-100/15 bg-cream-100/5 p-5 backdrop-blur-sm"
                >
                  <div className="font-display text-3xl text-cream-50">
                    {s.k}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-widest text-cream-100/60">
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Team() {
  return (
    <section className="section">
      <div className="container-narrow">
        <Reveal>
          <span className="eyebrow">Meet The Team</span>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">
            Operators first. Investors always.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {team.map((p, i) => (
            <Reveal key={p.name} delay={i * 80}>
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
                <h3 className="mt-1 font-display text-xl text-ink-900">
                  {p.name}
                </h3>
                <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-clay-500">
                  {p.role}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-700/70">
                  {p.bio}
                </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="section pt-0">
      <div className="container-narrow">
        <Reveal>
          <div className="relative overflow-hidden rounded-4xl border border-ink-700/10 bg-cream-50 px-8 py-14 text-center md:px-14 md:py-20">
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-sage-200/50 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-clay-300/40 blur-3xl" />
            <div className="relative">
              <span className="eyebrow">Ready when you are</span>
              <h2 className="mx-auto mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">
                Have a park that fits our buy box?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-ink-700/75">
                Send your deal directly to our acquisitions team. If it fits,
                we&apos;ll move quickly with a clear process from first look to
                close.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link to="/submit" className="btn-primary">
                  Submit a Park
                </Link>
                <Link to="/contact" className="btn-secondary">
                  Contact the Team
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <AssetClasses />
      <BuyBox />
      <WorkWithUs />
      <InvestBand />
      <Team />
      <FinalCTA />
    </>
  );
}

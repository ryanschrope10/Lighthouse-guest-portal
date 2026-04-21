import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";

const steps = [
  {
    title: "Join the Investor List",
    body: "Complete the form below to join our investor network and start receiving updates on upcoming opportunities.",
  },
  {
    title: "Review the Opportunity",
    body: "When we secure a deal, investors receive a full breakdown — financials, business plan, and investment structure.",
  },
  {
    title: "Invest Alongside Us",
    body: "Choose to participate and invest as a limited partner, private money lender, or preferred equity partner.",
  },
  {
    title: "We Operate the Asset",
    body: "Our team manages acquisition, operations, and value-add improvements while keeping you informed.",
  },
];

const structures = [
  {
    tag: "LP",
    title: "Limited Partner",
    body: "Passive ownership in the deal with pro-rata share of cash flow and upside.",
  },
  {
    tag: "PML",
    title: "Private Money Lender",
    body: "Secured debt position backed by the asset with defined rate and term.",
  },
  {
    tag: "PE",
    title: "Preferred Equity",
    body: "Profit participation and priority return, depending on the deal structure.",
  },
];

const receives = [
  "Access to off-market RV park and mobile home park opportunities",
  "Detailed deal breakdowns before investing",
  "Passive ownership while our team handles acquisition and operations",
  "Regular updates on project performance",
];

export default function Invest() {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <PageHeader
        eyebrow="Invest With Us"
        title={
          <>
            Invest in RV parks and{" "}
            <span className="italic text-forest-700">mobile home communities.</span>
          </>
        }
        description="Partner with Lighthouse Capital to invest in income-producing parks with strong fundamentals and clear value-add opportunities."
      />

      <section className="section pt-0">
        <div className="container-narrow">
          <div className="grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <h2 className="text-3xl leading-tight md:text-4xl">
                Why invest in this asset class.
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-700/80">
                <p>
                  RV parks and mobile home communities are some of the most
                  resilient real estate asset classes in the country. Demand for
                  affordable housing and long-term RV living continues to grow
                  while the supply of new parks remains extremely limited.
                </p>
                <p>
                  At Lighthouse Capital, we focus on acquiring parks with strong
                  fundamentals and clear operational upside. Our team actively
                  sources, acquires, and operates these assets while partnering
                  with investors who want exposure to this niche asset class.
                </p>
                <p>
                  As a capital partner, you invest alongside an experienced team
                  focused on improving operations, increasing income, and
                  creating long-term value.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120} className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { k: "~17%", v: "Target IRR" },
                  { k: "Off-Market", v: "Deal Flow" },
                  { k: "LP · PML · PE", v: "Flexible Structures" },
                  { k: "Transparent", v: "Aligned Incentives" },
                ].map((s) => (
                  <div
                    key={s.v}
                    className="rounded-2xl border border-ink-700/10 bg-cream-50 p-5"
                  >
                    <div className="font-display text-2xl text-ink-900">{s.k}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-clay-500">
                      {s.v}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-narrow">
          <Reveal>
            <span className="eyebrow">How It Works</span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">
              Four steps to invest alongside us.
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <div className="h-full rounded-3xl border border-ink-700/5 bg-cream-50 p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-glow">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 font-display text-lg text-cream-50">
                    {i + 1}
                  </div>
                  <h3 className="mt-5 font-display text-lg text-ink-900">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-700/75">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-narrow grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl bg-cream-200/60 p-8 md:p-10">
              <span className="eyebrow">Projected Returns</span>
              <h3 className="mt-4 font-display text-3xl">
                Target IRR around 17%.
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-ink-700/80">
                <li className="flex gap-3">
                  <span className="mt-1.5 block h-1.5 w-1.5 flex-none rounded-full bg-forest-600" />
                  Strong cash-flow potential with long-term appreciation
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 block h-1.5 w-1.5 flex-none rounded-full bg-forest-600" />
                  Value-add opportunities designed to increase NOI
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 block h-1.5 w-1.5 flex-none rounded-full bg-forest-600" />
                  Alignment across fees, structure, and incentives
                </li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="h-full rounded-3xl bg-forest-800 p-8 text-cream-100 md:p-10">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-clay-300">
                What Investors Receive
              </span>
              <h3 className="mt-4 font-display text-3xl text-cream-50">
                Access, clarity, and partnership.
              </h3>
              <ul className="mt-6 space-y-3 text-sm text-cream-100/80">
                {receives.map((r) => (
                  <li key={r} className="flex gap-3">
                    <span className="mt-1.5 block h-1.5 w-1.5 flex-none rounded-full bg-clay-400" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section pt-0">
        <div className="container-narrow">
          <Reveal>
            <span className="eyebrow">Investment Structures</span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 max-w-2xl text-4xl leading-tight md:text-5xl">
              Three ways to partner with us.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {structures.map((s, i) => (
              <Reveal key={s.title} delay={i * 100}>
                <div className="h-full rounded-3xl border border-ink-700/5 bg-cream-50 p-7">
                  <div className="inline-flex rounded-full bg-sage-200 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-forest-800">
                    {s.tag}
                  </div>
                  <h3 className="mt-5 font-display text-xl text-ink-900">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-700/75">
                    {s.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-xs text-ink-700/50">
            All investments are deal-dependent and provided with full details
            prior to participation.
          </p>
        </div>
      </section>

      <section className="section pt-0" id="investor-form">
        <div className="container-narrow">
          <div className="grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-5">
              <span className="eyebrow">Investor Intake</span>
              <h2 className="mt-4 text-4xl leading-tight md:text-5xl">
                Join the investor list.
              </h2>
              <p className="mt-5 text-base text-ink-700/80">
                Tell us a bit about your investment preferences. We&apos;ll
                follow up with details on current and upcoming opportunities
                that fit your profile.
              </p>
              <div className="mt-10 rounded-3xl border border-ink-700/5 bg-cream-50 p-6">
                <p className="text-sm italic text-ink-700/80">
                  &ldquo;Lighthouse runs a tight process. Clear numbers, clear
                  comms, and they actually operate the parks themselves — that&apos;s
                  the part you don&apos;t always get in this space.&rdquo;
                </p>
                <div className="mt-4 text-xs font-semibold uppercase tracking-widest text-clay-500">
                  — LP Investor, Texas
                </div>
              </div>
            </Reveal>

            <Reveal delay={120} className="lg:col-span-7">
              {submitted ? (
                <div className="rounded-4xl border border-forest-600/20 bg-cream-50 p-10 text-center shadow-soft">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage-200 text-forest-800">
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="mt-6 font-display text-3xl text-ink-900">
                    You&apos;re on the list.
                  </h3>
                  <p className="mx-auto mt-4 max-w-md text-base text-ink-700/75">
                    We&apos;ll reach out with opportunities that match your
                    profile. In the meantime, feel free to review our current
                    portfolio.
                  </p>
                  <Link to="/" className="btn-secondary mt-8">
                    Back to Home
                  </Link>
                </div>
              ) : (
                <form
                  onSubmit={onSubmit}
                  className="rounded-4xl border border-ink-700/10 bg-cream-50 p-8 shadow-soft md:p-10"
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="label">Full Name</label>
                      <input type="text" className="input-field" required />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input type="email" className="input-field" required />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input type="tel" className="input-field" required />
                    </div>
                    <div>
                      <label className="label">Investor Category</label>
                      <select className="input-field" defaultValue="">
                        <option value="" disabled>
                          Select one
                        </option>
                        <option>Individual</option>
                        <option>Entity</option>
                        <option>Trust</option>
                        <option>IRA / 401k</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Preferred Asset</label>
                      <select className="input-field" defaultValue="">
                        <option value="" disabled>
                          Select one
                        </option>
                        <option>RV Parks</option>
                        <option>Mobile Home Parks</option>
                        <option>Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Investment Range</label>
                      <select className="input-field" defaultValue="">
                        <option value="" disabled>
                          Select one
                        </option>
                        <option>$50,000</option>
                        <option>$100,000</option>
                        <option>$250,000</option>
                        <option>$500,000+</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Accredited Status</label>
                      <select className="input-field" defaultValue="">
                        <option value="" disabled>
                          Select one
                        </option>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Liquidity Timeline</label>
                      <div className="grid grid-cols-3 gap-3">
                        {["Ready Now", "30–60 Days", "6+ Months"].map((v) => (
                          <label
                            key={v}
                            className="flex cursor-pointer items-center justify-center rounded-2xl border border-cream-300 bg-cream-50 px-3 py-3 text-sm font-medium text-ink-800 transition-colors has-[:checked]:border-forest-700 has-[:checked]:bg-forest-700 has-[:checked]:text-cream-50"
                          >
                            <input
                              type="radio"
                              name="liquidity"
                              value={v}
                              className="sr-only"
                            />
                            {v}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Comments</label>
                      <textarea
                        rows={4}
                        className="input-field"
                        placeholder="Anything we should know about your investment goals?"
                      />
                    </div>
                  </div>
                  <div className="mt-8 flex flex-col items-start gap-4 border-t border-ink-700/10 pt-6 md:flex-row md:items-center md:justify-between">
                    <p className="text-xs text-ink-700/60">
                      Your information is kept confidential.
                    </p>
                    <button type="submit" className="btn-primary">
                      Submit
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

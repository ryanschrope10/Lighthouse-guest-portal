import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";

const states = [
  "AL","AK","AZ","AR","FL","GA","ID","IN","IA","KS","KY","LA","MI","MS","MO",
  "MT","NE","NV","NC","ND","OH","OK","PA","SC","SD","TN","TX","UT","WV","WI","WY","Other",
];

const buyBoxBullets = [
  "$4M – $10M+ purchase price",
  "RV parks at 10%+ cap rate (or clear path within 6 months)",
  "Mobile home communities at 7%+ cap rate",
  "50+ sites or pads preferred",
  "Value-add or operational upside",
  "Long-term residents preferred; transient secondary",
  "Landlord-friendly states — strong focus on TX and ID",
  "Mountain West and Southeast markets welcome",
  "Direct, brokered, and off-market opportunities",
];

const whatToSend = [
  "Property address or location",
  "Number of sites or pads",
  "Current occupancy",
  "Asking price or expectation",
  "T12 and rent roll if available",
  "Utility structure (park-owned or tenant-paid)",
  "Photos or marketing package",
  "Broker or owner contact info",
];

export default function Submit() {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <PageHeader
        eyebrow="Submit a Park"
        title={
          <>
            RV &amp; mobile home parks —{" "}
            <span className="italic text-forest-700">reviewed fast.</span>
          </>
        }
        description="Please review our buy box and the details we need before submitting. Every deal flows through our central acquisitions pipeline for immediate evaluation."
      />

      <section className="section pt-0">
        <div className="container-narrow grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="sticky top-28 space-y-8">
              <div className="rounded-3xl border border-ink-700/5 bg-cream-50 p-8">
                <h3 className="font-display text-xl text-ink-900">Our Buy Box</h3>
                <ul className="mt-4 space-y-2.5 text-sm text-ink-700/80">
                  {buyBoxBullets.map((b) => (
                    <li key={b} className="flex gap-3">
                      <span className="mt-1.5 block h-1.5 w-1.5 flex-none rounded-full bg-clay-500" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-ink-700/5 bg-cream-50 p-8">
                <h3 className="font-display text-xl text-ink-900">
                  What to Send Us
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-ink-700/80">
                  {whatToSend.map((b) => (
                    <li key={b} className="flex gap-3">
                      <span className="mt-1.5 block h-1.5 w-1.5 flex-none rounded-full bg-forest-600" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-forest-800 p-8 text-cream-100">
                <h3 className="font-display text-xl">What Happens Next</h3>
                <ol className="mt-4 space-y-4 text-sm text-cream-100/80">
                  {[
                    "Our acquisitions team reviews the deal.",
                    "If it fits our criteria, we request additional information.",
                    "If it moves forward, we work directly with you through the process.",
                  ].map((s, i) => (
                    <li key={s} className="flex gap-4">
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-cream-100/10 font-display text-sm">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
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
                  Deal received.
                </h3>
                <p className="mx-auto mt-4 max-w-md text-base text-ink-700/75">
                  Thanks for sending this over. Our acquisitions team will
                  review within 48 hours and follow up directly if it fits our
                  criteria.
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
                <h2 className="text-2xl text-ink-900">Property Details</h2>
                <p className="mt-2 text-sm text-ink-700/75">
                  Please submit the property details below. All submissions are
                  processed through our central pipeline for immediate review.
                </p>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="label">Property State</label>
                    <select className="input-field" required defaultValue="">
                      <option value="" disabled>
                        Select a state
                      </option>
                      {states.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Number of Pads / Units</label>
                    <input
                      type="text"
                      placeholder="e.g. 75 pads"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Asking Price</label>
                    <input
                      type="text"
                      placeholder="$5,000,000 – $12,000,000"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Cap Rate</label>
                    <input
                      type="text"
                      placeholder="7% or higher"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Financials Available?</label>
                    <select className="input-field" defaultValue="">
                      <option value="" disabled>
                        Select one
                      </option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Source</label>
                    <select className="input-field" defaultValue="">
                      <option value="" disabled>
                        Select one
                      </option>
                      <option>Direct to Seller</option>
                      <option>Direct to Agent</option>
                      <option>Wholesaler</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Listing Type</label>
                    <div className="flex flex-wrap gap-4">
                      {["Off-Market", "Crexi Listing", "Other Public Listing"].map(
                        (opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-4 py-2 text-sm text-ink-800 transition-colors hover:border-forest-600 has-[:checked]:border-forest-700 has-[:checked]:bg-forest-700 has-[:checked]:text-cream-50"
                          >
                            <input type="checkbox" className="sr-only" />
                            {opt}
                          </label>
                        ),
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="label">Under Contract?</label>
                    <div className="flex gap-3">
                      {["Yes", "No"].map((v) => (
                        <label
                          key={v}
                          className="flex flex-1 cursor-pointer items-center justify-center rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-sm font-medium text-ink-800 transition-colors has-[:checked]:border-forest-700 has-[:checked]:bg-forest-700 has-[:checked]:text-cream-50"
                        >
                          <input
                            type="radio"
                            name="underContract"
                            value={v}
                            className="sr-only"
                          />
                          {v}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Property Type</label>
                    <select className="input-field" defaultValue="">
                      <option value="" disabled>
                        Select one
                      </option>
                      <option>RV Park</option>
                      <option>Mobile Home Park</option>
                      <option>Both</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">
                      How would you like to partner?
                    </label>
                    <input
                      type="text"
                      placeholder="Open field — tell us what you're looking for"
                      className="input-field"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Supporting Documents</label>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-ink-700/20 bg-cream-100 px-5 py-4 text-sm text-ink-700/70">
                      <span>OM, T12, P&amp;L, rent roll, photos…</span>
                      <label className="cursor-pointer rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-cream-50 hover:bg-forest-800">
                        Choose files
                        <input type="file" multiple className="sr-only" />
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Your Name</label>
                    <input type="text" className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input-field" required />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input type="tel" className="input-field" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-start gap-3 text-sm text-ink-700/80">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-cream-300 text-forest-700 focus:ring-forest-600"
                      />
                      <span>
                        I agree to receive SMS and email communications from
                        Lighthouse Capital Partners about this deal. Standard
                        rates may apply; reply STOP to opt out.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-start gap-4 border-t border-ink-700/10 pt-6 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs text-ink-700/60">
                    Submissions reviewed within 48 hours.
                  </p>
                  <button type="submit" className="btn-primary">
                    Submit Deal for Review
                  </button>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}

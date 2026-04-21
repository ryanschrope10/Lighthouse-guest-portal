import { Link } from "react-router-dom";
import Logo from "./Logo";

const social = [
  {
    name: "LinkedIn",
    href: "#",
    svg: (
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6 1.12 6 0 4.88 0 3.5 0 2.12 1.12 1 2.49 1c1.38 0 2.49 1.12 2.49 2.5zM.22 8h4.54v14H.22V8zM8.59 8h4.35v1.91h.06c.61-1.15 2.09-2.36 4.3-2.36 4.6 0 5.45 3.03 5.45 6.97V22h-4.54v-6.2c0-1.48-.03-3.39-2.07-3.39-2.07 0-2.39 1.62-2.39 3.28V22H8.59V8z" />
    ),
  },
  {
    name: "Instagram",
    href: "#",
    svg: (
      <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.5.42.8.86 1 1.4.2.43.4 1.03.4 2.23.1 1.27.1 1.66.1 4.88 0 3.22 0 3.6-.1 4.88-.05 1.2-.2 1.8-.4 2.23-.2.54-.5.98-1 1.4-.4.42-.8.68-1.4.9-.4.17-1 .37-2.2.42-1.3.07-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.2-.42-.6-.22-1-.48-1.4-.9-.5-.42-.8-.86-1-1.4-.2-.43-.4-1.03-.4-2.23-.1-1.28-.1-1.66-.1-4.88 0-3.22 0-3.6.1-4.88.05-1.2.2-1.8.4-2.23.2-.54.5-.98 1-1.4.4-.42.8-.68 1.4-.9.4-.17 1-.37 2.2-.42 1.3-.07 1.7-.07 4.9-.07zm0 2.16c-3.15 0-3.5 0-4.76.06-1.15.05-1.77.24-2.18.4-.55.21-.94.46-1.35.87-.42.42-.67.81-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.25-.07 1.62-.07 4.78s0 3.53.06 4.78c.05 1.15.24 1.77.4 2.18.21.54.46.93.88 1.35.41.41.8.66 1.35.87.41.16 1.03.35 2.18.4 1.26.06 1.61.07 4.76.07s3.5 0 4.76-.06c1.15-.05 1.77-.24 2.18-.4.55-.21.94-.46 1.35-.87.42-.42.67-.81.88-1.35.16-.41.35-1.03.4-2.18.06-1.25.06-1.62.06-4.78s0-3.53-.06-4.78c-.05-1.15-.24-1.77-.4-2.18a3.66 3.66 0 00-.88-1.35 3.66 3.66 0 00-1.35-.87c-.41-.16-1.03-.35-2.18-.4-1.26-.06-1.61-.07-4.76-.07zm0 3.68a5.92 5.92 0 110 11.84 5.92 5.92 0 010-11.84zm0 2.16a3.76 3.76 0 100 7.52 3.76 3.76 0 000-7.52zm6.16-2.4a1.38 1.38 0 11-2.76 0 1.38 1.38 0 012.76 0z" />
    ),
  },
  {
    name: "X",
    href: "#",
    svg: (
      <path d="M18.24 2H21.5l-7.12 8.14L22.8 22h-6.56l-5.14-6.72L5.24 22H2l7.62-8.72L1.6 2h6.72l4.64 6.14L18.24 2zm-1.15 18h1.81L7.02 3.88H5.07L17.09 20z" />
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-forest-800 text-cream-100">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-20 lg:px-10">
        <div className="grid gap-12 border-b border-cream-100/10 pb-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo variant="light" />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-cream-100/70">
              Building generational wealth together by acquiring and operating
              RV parks and mobile home communities with strong fundamentals and
              long-term upside.
            </p>
            <div className="mt-8 flex items-center gap-3">
              {social.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  aria-label={s.name}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-100/15 text-cream-100/70 transition-all hover:-translate-y-0.5 hover:border-clay-400 hover:text-clay-300"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    {s.svg}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:col-span-7 lg:grid-cols-3">
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-clay-300">
                Explore
              </h4>
              <ul className="space-y-3 text-sm text-cream-100/80">
                <li>
                  <Link to="/" className="hover:text-clay-300">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/submit" className="hover:text-clay-300">
                    Submit a Park
                  </Link>
                </li>
                <li>
                  <Link to="/invest" className="hover:text-clay-300">
                    Invest With Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-clay-300">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-clay-300">
                Resources
              </h4>
              <ul className="space-y-3 text-sm text-cream-100/80">
                <li>
                  <a
                    href="https://drive.google.com/file/d/1k809MMimB6JltD3JKSZeN_dycLRzPXNT/view?usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-clay-300"
                  >
                    Current Portfolio
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfpS-yu6dBAlyD3dlusPzcIsn99e0pRxSijHcg-h9t0XBRR_w/viewform?usp=header"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-clay-300"
                  >
                    Learn From Us
                  </a>
                </li>
                <li>
                  <Link to="/invest" className="hover:text-clay-300">
                    Investor Deck
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-clay-300">
                Get in touch
              </h4>
              <ul className="space-y-3 text-sm text-cream-100/80">
                <li>
                  <a
                    href="mailto:hello@wearelcp.com"
                    className="hover:text-clay-300"
                  >
                    hello@wearelcp.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+14699848503"
                    className="hover:text-clay-300"
                  >
                    (469) 984-8503
                  </a>
                </li>
                <li>
                  <Link to="/submit" className="hover:text-clay-300">
                    Submit a deal
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 pt-8 text-xs text-cream-100/50 md:flex-row md:items-center">
          <p>© 2026 Lighthouse Capital Partners. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/" className="hover:text-clay-300">
              Privacy Policy
            </Link>
            <Link to="/" className="hover:text-clay-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

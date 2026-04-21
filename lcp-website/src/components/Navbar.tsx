import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Logo from "./Logo";

const links = [
  { to: "/", label: "Home" },
  { to: "/invest", label: "Invest With Us" },
  { to: "/contact", label: "Contact" },
];

const mobileLinks = [
  { to: "/", label: "Home" },
  { to: "/submit", label: "Submit a Park" },
  { to: "/invest", label: "Invest With Us" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-cream-100/85 backdrop-blur-md shadow-[0_1px_0_rgba(45,74,62,0.08)]"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" aria-label="Lighthouse Capital Partners home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-forest-800"
                    : "text-ink-700 hover:text-forest-700"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/submit" className="btn-primary !py-2.5 !px-5 !text-xs">
            Submit a Park
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-700/10 bg-cream-50 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <div className="relative h-3 w-5">
            <span
              className={`absolute left-0 top-0 block h-0.5 w-5 bg-ink-800 transition-transform duration-300 ${
                open ? "translate-y-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 bottom-0 block h-0.5 w-5 bg-ink-800 transition-transform duration-300 ${
                open ? "-translate-y-1 -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </nav>

      <div
        className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-500 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-4 mb-4 rounded-3xl border border-ink-700/10 bg-cream-50 p-6 shadow-soft">
          <ul className="space-y-4">
            {mobileLinks.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) =>
                    `block text-base font-medium ${
                      isActive ? "text-forest-800" : "text-ink-700"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <Link to="/submit" className="btn-primary mt-6 w-full">
            Submit a Park
          </Link>
        </div>
      </div>
    </header>
  );
}

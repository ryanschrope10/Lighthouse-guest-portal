/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FDFBF7",
          100: "#F7F3EC",
          200: "#EFE8DC",
          300: "#E4D9C5",
        },
        clay: {
          300: "#D9B99B",
          400: "#C89B77",
          500: "#B17F5A",
          600: "#8F6142",
        },
        forest: {
          500: "#4A6B5B",
          600: "#3A5748",
          700: "#2D4A3E",
          800: "#1F3329",
          900: "#15241D",
        },
        ink: {
          700: "#3A322B",
          800: "#2B2622",
          900: "#1A1714",
        },
        sage: {
          200: "#D6DFD2",
          300: "#BAC7B3",
          400: "#9BAE92",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "ui-serif", "Georgia", "serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -8px rgba(45, 74, 62, 0.15)",
        glow: "0 10px 40px -12px rgba(45, 74, 62, 0.25)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease-out forwards",
        "fade-in": "fadeIn 1s ease-out forwards",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};

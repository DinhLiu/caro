/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.4)", opacity: "0" },
          "70%": { transform: "scale(1.12)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "win-pulse": {
          "0%, 100%": { transform: "scale(1)", filter: "brightness(1)" },
          "50%": { transform: "scale(1.08)", filter: "brightness(1.3)" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "win-pulse": "win-pulse 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

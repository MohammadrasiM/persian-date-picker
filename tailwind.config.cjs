module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  important: ".mpd-datepicker",
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        primary: {
          500: "rgb(var(--mpd-primary, 232 59 86) / <alpha-value>)",
          border: "rgb(var(--mpd-border, 219 221 220) / <alpha-value>)",
        },
        dashboard: {
          text: "rgb(var(--mpd-text, 45 52 94) / <alpha-value>)",
          danger: "rgb(var(--mpd-error, 229 59 86) / <alpha-value>)",
        },
        surface: "rgb(var(--mpd-background, 255 255 255) / <alpha-value>)",
      },
    },
  },
};

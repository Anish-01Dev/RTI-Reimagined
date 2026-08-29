/** @type {import('tailwindcss').Config} */
// "Civic Clarity" design system — institutional, not startup.
// A restrained blue-on-paper palette, tight radii, minimal shadow.
// Semantic status colours are named (warn/danger/success/info) so no
// component hardcodes a hex. Keep in sync with src/index.css.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        canvas: "#f6f6f4", // application background
        panel: "#ffffff", // cards / tables / rails
        "panel-2": "#fbfbfa", // inset / header strips
        "panel-3": "#f1f1ef", // hover / selected rows

        // Ink
        ink: "#1a1c1c",
        "ink-2": "#41444d", // secondary text
        "ink-3": "#6b6e78", // metadata / labels

        // Lines
        line: "#e2e2df",
        "line-2": "#d3d3ce",

        // Brand
        primary: "#0b4fb0",
        "primary-strong": "#083b85",
        "primary-wash": "#eef3fb",
        "primary-line": "#c6d8f0",

        // Status
        danger: "#b3261e",
        "danger-wash": "#fdeceb",
        "danger-line": "#f2c7c4",
        warn: "#8a5300",
        "warn-wash": "#fbf1de",
        "warn-line": "#ecd7ac",
        success: "#0f6b45",
        "success-wash": "#e7f2ec",
        "success-line": "#bcdccb",

        // Government chrome (dark operations console)
        gov: {
          bg: "#0d1521",
          panel: "#141f2e",
          "panel-2": "#1b2a3d",
          line: "#26364b",
          ink: "#e6ecf3",
          "ink-2": "#9fb0c3",
          "ink-3": "#6c7d92",
        },

        // --- legacy Material token aliases (kept so un-migrated
        //     components still resolve; new code uses the names above) ---
        background: "#f6f6f4",
        surface: "#f6f6f4",
        "surface-bright": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#fbfbfa",
        "surface-container": "#f1f1ef",
        "surface-container-high": "#e8e8e6",
        "surface-container-highest": "#e2e2df",
        "surface-variant": "#e2e2df",
        "surface-dim": "#dadad9",
        "on-background": "#1a1c1c",
        "on-surface": "#1a1c1c",
        "on-surface-variant": "#41444d",
        outline: "#6b6e78",
        "outline-variant": "#e2e2df",
        "primary-container": "#0b4fb0",
        "primary-fixed": "#eef3fb",
        "primary-fixed-dim": "#c6d8f0",
        "on-primary": "#ffffff",
        "on-primary-container": "#eef3fb",
        "on-primary-fixed": "#083b85",
        "on-primary-fixed-variant": "#0b4fb0",
        "primary-fixed-variant": "#083b85",
        secondary: "#41444d",
        "secondary-container": "#e5e8ef",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#41444d",
        "surface-tint": "#0b4fb0",
        "inverse-primary": "#c6d8f0",
        tertiary: "#0f6b45",
        "tertiary-container": "#0f6b45",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#e7f2ec",
        "tertiary-fixed-variant": "#0b543a",
        error: "#b3261e",
        "error-container": "#fdeceb",
        "on-error": "#ffffff",
        "on-error-container": "#7c1a15",
        "inverse-surface": "#2f3130",
        "inverse-on-surface": "#f1f1f0",
      },
      fontFamily: {
        sans: ["Inter", "Noto Sans Devanagari", "system-ui", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
        serif: ["Georgia", "Cambria", "serif"],
        devanagari: ["Noto Sans Devanagari", "Inter", "sans-serif"],
        // legacy aliases
        "body-base": ["Inter", "Noto Sans Devanagari", "sans-serif"],
        "headline-md": ["Inter", "Noto Sans Devanagari", "sans-serif"],
        "body-sm": ["Inter", "Noto Sans Devanagari", "sans-serif"],
        "display-lg": ["Inter", "Noto Sans Devanagari", "sans-serif"],
        "label-caps": ["Inter", "Noto Sans Devanagari", "sans-serif"],
        "status-label": ["Inter", "Noto Sans Devanagari", "sans-serif"],
        "display-lg-mobile": ["Inter", "Noto Sans Devanagari", "sans-serif"],
      },
      fontSize: {
        display: ["40px", { lineHeight: "44px", letterSpacing: "-0.021em", fontWeight: "600" }],
        "display-sm": ["30px", { lineHeight: "36px", letterSpacing: "-0.019em", fontWeight: "600" }],
        title: ["19px", { lineHeight: "26px", letterSpacing: "-0.012em", fontWeight: "600" }],
        "section": ["13px", { lineHeight: "16px", letterSpacing: "0.06em", fontWeight: "600" }],
        eyebrow: ["11px", { lineHeight: "14px", letterSpacing: "0.08em", fontWeight: "600" }],
        // legacy aliases
        "body-base": ["15px", { lineHeight: "23px" }],
        "headline-md": ["19px", { lineHeight: "26px", letterSpacing: "-0.012em", fontWeight: "600" }],
        "body-sm": ["13.5px", { lineHeight: "20px" }],
        "display-lg": ["40px", { lineHeight: "44px", letterSpacing: "-0.021em", fontWeight: "600" }],
        "label-caps": ["11px", { lineHeight: "14px", letterSpacing: "0.07em", fontWeight: "600" }],
        "status-label": ["12px", { lineHeight: "16px", fontWeight: "600" }],
        "display-lg-mobile": ["30px", { lineHeight: "36px", letterSpacing: "-0.017em", fontWeight: "600" }],
      },
      borderRadius: {
        DEFAULT: "5px",
        md: "6px",
        lg: "8px",
        xl: "10px",
        "2xl": "14px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04)",
        raised: "0 4px 16px -4px rgba(16, 24, 40, 0.12)",
        drawer: "-8px 0 32px -12px rgba(16, 24, 40, 0.18)",
      },
      maxWidth: {
        workspace: "1360px",
        "container-max": "1360px",
        reading: "680px",
      },
      spacing: {
        gutter: "24px",
        base: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "72px",
        sidebar: "244px",
        topbar: "60px",
      },
    },
  },
  plugins: [],
};

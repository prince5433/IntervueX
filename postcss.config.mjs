/*
 * Natural-Language File Comment:
 * File Role: CSS processing pipeline define karta hai (Tailwind PostCSS plugin wiring).
 * Project Flow Link: 'postcss.config.mjs' styling build step me CSS transforms apply karne ke liye use hota hai.
 * Read Order: config object -> plugins -> export.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

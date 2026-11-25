import { EleventyHtmlBasePlugin } from "@11ty/eleventy";

// Self-hosted fonts: only the files the site uses are copied from the npm packages.
const fonts = [
  ["fira-sans", [["500", "normal"], ["600", "normal"], ["700", "normal"]]],
  ["ibm-plex-sans", [["400", "normal"], ["400", "italic"], ["500", "normal"], ["600", "normal"]]]
];

const dateFormat = (options) => (value) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", ...options }).format(new Date(value));

export default function (eleventyConfig) {
  // Rewrites links that start with "/" so the site also works under a sub-path.
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  for (const [family, styles] of fonts) {
    for (const [weight, style] of styles) {
      for (const subset of ["latin", "latin-ext"]) {
        const file = `${family}-${subset}-${weight}-${style}.woff2`;
        eleventyConfig.addPassthroughCopy({
          [`node_modules/@fontsource/${family}/files/${file}`]: `assets/fonts/${file}`
        });
      }
    }
  }
  eleventyConfig.addWatchTarget("content/");

  eleventyConfig.addFilter("longDate", dateFormat({ day: "numeric", month: "long", year: "numeric" }));
  eleventyConfig.addFilter("day", dateFormat({ day: "2-digit" }));
  eleventyConfig.addFilter("month", dateFormat({ month: "short" }));

  // Decorative square patterns (the brand's graphic device). Returns a list of
  // true/false values: true squares are filled.
  eleventyConfig.addFilter("tiles", (seed, count) => {
    let n = 0;
    for (const ch of String(seed)) n = (n * 31 + ch.charCodeAt(0)) % 9973;
    return Array.from({ length: count }, (_, i) => (i * 7 + n) % 5 === 0);
  });
  eleventyConfig.addFilter("pattern", (rows) => rows.join("").split("").map((c) => c === "1"));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.PATH_PREFIX || "/"
  };
}

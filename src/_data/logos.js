// Says which logo files are present, so a missing file never shows as a broken image.
import fs from "node:fs";

const has = (file) => fs.existsSync(`src/assets/logos/${file}`);

export default {
  responsive: has("logo-responsive.svg"),
  primary: has("logo-primary.png"),
  universityOfLondon: has("university-of-london-white.svg")
};

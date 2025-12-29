
function parseDuration(input) {
  if (!input || typeof input !== "string") return null;
  const s = input.toLowerCase().replace(/\s+/g, "");
  const re = /(\d+)(ms|s|m|h|d|w)/g;

  let total = 0;
  let match;
  let found = false;

  while ((match = re.exec(s)) !== null) {
    found = true;
    const n = Number(match[1]);
    const unit = match[2];
    if (!Number.isFinite(n)) return null;

    const mult = {
      ms: 1,
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
      w: 604_800_000
    }[unit];

    total += n * mult;
  }

  if (!found || total <= 0) return null;
  return total;
}

function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  const units = [
    ["jours", 86_400_000],
    ["heures", 3_600_000],
    ["minutes", 60_000],
    ["secondes", 1000]
  ];

  let rest = ms;
  const parts = [];

  for (const [label, mult] of units) {
    const q = Math.floor(rest / mult);
    if (q > 0) {
      parts.push(`${q} ${label}`);
      rest -= q * mult;
    }
  }

  return parts.join(" ");
}

module.exports = { parseDuration, formatDuration };

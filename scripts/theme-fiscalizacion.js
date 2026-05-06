import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const p = path.join(__dirname, "../src/pages/fiscalizacion/fiscalizacion-page-v2.tsx");
let s = fs.readFileSync(p, "utf8");

const pairs = [
    ["border-slate-800/80", "border-border"],
    ["border-slate-800", "border-border"],
    ["bg-slate-900/80 border border-border", "bg-muted/80 border border-border"],
    ["bg-slate-900/40 text-slate-100", "bg-card text-card-foreground shadow-sm"],
    [
        'DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-xl max-h-[90vh] overflow-y-auto"',
        'DialogContent className="bg-card border-border text-card-foreground max-w-xl max-h-[90vh] overflow-y-auto"',
    ],
    [
        'DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md"',
        'DialogContent className="bg-card border-border text-card-foreground max-w-md"',
    ],
    ['SelectContent className="bg-slate-900 border-slate-700 text-slate-100 max-h-60"', 'SelectContent className="max-h-60"'],
    ['SelectContent className="bg-slate-900 border-slate-700 text-slate-100"', "SelectContent"],
    ["w-[160px] bg-slate-950 border-slate-700 text-slate-100", "w-[160px] bg-background border-border"],
    ["bg-slate-950 border-slate-700 text-slate-100 w-[160px]", "bg-background border-border w-[160px]"],
    ["bg-slate-950 border-slate-700 font-mono text-xs", "bg-background border-border font-mono text-xs"],
    ["bg-slate-950 border-slate-700 min-h-[80px]", "bg-background border-border min-h-[80px]"],
    ["bg-slate-950 border-slate-700 min-h-[72px]", "bg-background border-border min-h-[72px]"],
    ['className="bg-slate-950 border-slate-700"', 'className="bg-background border-border"'],
    ["bg-slate-950 border-slate-700", "bg-background border-border"],
    ["bg-slate-950/50", "bg-muted/30 dark:bg-slate-950/50"],
    ["bg-slate-950/40", "bg-muted/25 dark:bg-slate-950/40"],
    ["text-slate-400", "text-muted-foreground"],
    ["text-slate-500", "text-muted-foreground"],
    ["text-slate-300", "text-foreground"],
    ["text-slate-200", "text-foreground"],
    ["text-slate-100", "text-foreground"],
    ["text-white", "text-foreground"],
    ["border-slate-600 text-slate-200", "border-border"],
    ["border-slate-600", "border-border"],
    ["h-2 rounded-full bg-slate-800 overflow-hidden", "h-2 rounded-full bg-muted overflow-hidden"],
    ['Badge variant="secondary" className="bg-slate-800 text-slate-200 text-xs"', 'Badge variant="secondary" className="text-xs"'],
];

for (const [a, b] of pairs) {
    const count = s.split(a).length - 1;
    if (count === 0) console.warn("No match:", a.slice(0, 70));
    s = s.split(a).join(b);
}

fs.writeFileSync(p, s);
console.log("Written:", p);

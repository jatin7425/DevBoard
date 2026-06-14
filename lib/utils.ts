export const uid = (p = "") => p + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export const cx = (...a: any[]) => a.filter(Boolean).join(" ");

export const DAY = 86400000;

export function startOfDay(d: Date | number | string) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameDay(a: Date | number | string, b: Date | number | string) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function daysBetween(a: any, b: any) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
}

export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function fmtDate(d: any) {
  if (!d) return "";
  const dt = new Date(d), now = new Date();
  const diff = daysBetween(now, dt);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const s = `${MON[dt.getMonth()]} ${dt.getDate()}`;
  return dt.getFullYear() !== now.getFullYear() ? `${s}, ${dt.getFullYear()}` : s;
}

export function fmtDateInput(d: any) {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function relTime(d: any) {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 604800) return Math.floor(s / 86400) + "d ago";
  return fmtDate(d);
}

export function fmtDuration(sec: number) {
  sec = Math.floor(sec || 0);
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

export function fmtClock(sec: number) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function dueState(d: any, done: boolean) {
  if (!d || done === true) return "";
  const diff = daysBetween(new Date(), new Date(d));
  if (diff < 0) return "over";
  if (diff <= 2) return "soon";
  return "";
}

export function escapeHtml(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightCode(code: string, lang: string): string {
  if (!code) return code;
  const l = lang.toLowerCase();

  const jsLike = ["js", "javascript", "ts", "typescript", "jsx", "tsx", "go", "rust", "rs", "java", "c", "cpp", "cs", "swift", "kotlin"].includes(l);
  const pyLike = ["python", "py", "ruby", "rb", "bash", "sh", "shell", "yaml", "yml", "toml"].includes(l);
  const sqlLike = ["sql", "mysql", "postgres", "pgsql"].includes(l);
  const cssLike = ["css", "scss", "less"].includes(l);

  let kws: Set<string> = new Set();
  let types: Set<string> = new Set();
  
  if (jsLike) {
    kws = new Set(["const","let","var","function","return","if","else","for","while","class","import","export","from","async","await","new","this","typeof","instanceof","throw","try","catch","finally","switch","case","break","continue","default","yield","of","in","do","extends","implements","interface","type","enum","namespace","declare","public","private","protected","static","readonly","abstract","as","is","keyof","void","null","undefined","true","false"]);
    types = new Set(["string", "number", "boolean", "any", "never", "unknown", "object", "symbol", "bigint", "Promise", "Array", "Map", "Set", "Record", "Partial", "Required", "Readonly", "Pick", "Omit"]);
  } else if (pyLike) {
    kws = new Set(["def","class","import","from","return","if","elif","else","for","while","try","except","finally","with","as","in","not","and","or","is","None","True","False","raise","yield","pass","break","continue","lambda","global","nonlocal","del","async","await","self"]);
  } else if (sqlLike) {
    kws = new Set(["SELECT","FROM","WHERE","INSERT","UPDATE","DELETE","CREATE","DROP","ALTER","TABLE","INDEX","JOIN","LEFT","RIGHT","INNER","OUTER","ON","AS","AND","OR","NOT","IN","EXISTS","BETWEEN","LIKE","ORDER","BY","GROUP","HAVING","LIMIT","OFFSET","SET","VALUES","INTO","NULL","TRUE","FALSE","IS","DISTINCT","UNION","ALL","COUNT","SUM","AVG","MIN","MAX","PRIMARY","KEY","FOREIGN","REFERENCES","CASCADE","CONSTRAINT","DEFAULT","CHECK","UNIQUE","select","from","where","insert","update","delete","create","drop","alter","table","index","join","left","right","inner","outer","on","as","and","or","not","in","exists","between","like","order","by","group","having","limit","offset","set","values","into","null","true","false","is","distinct","union","all","count","sum","avg","min","max","primary","key","foreign","references","cascade","constraint","default","check","unique"]);
  } else if (cssLike) {
    kws = new Set(["import","media","keyframes","from","to","inherit","initial","unset","none","auto","flex","grid","block","inline","relative","absolute","fixed","sticky","hidden","visible","solid","dashed","dotted","transparent"]);
  } else {
    kws = new Set(["const","let","var","function","return","if","else","for","while","class","def","import","export"]);
  }

  if (jsLike) {
    const jsRegex = /(\/\*[\s\S]*?\*\/)|(\/\/.*)|('(?:\\.|[^'])*')|("(?:\\.|[^"])*")|(`(?:\\.|[^`])*`)|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*\b)/g;
    return code.replace(jsRegex, (match, mCmt1, mCmt2, mStr1, mStr2, mStr3, mNum, mWord) => {
      if (mCmt1 || mCmt2) return `<span class="hl-cmt">${match}</span>`;
      if (mStr1 || mStr2 || mStr3) return `<span class="hl-str">${match}</span>`;
      if (mNum) return `<span class="hl-num">${match}</span>`;
      if (mWord) {
        if (kws.has(match)) return `<span class="hl-kw">${match}</span>`;
        if (types.has(match)) return `<span class="hl-type">${match}</span>`;
        return match;
      }
      return match;
    });
  }

  if (pyLike) {
    const pyRegex = /("""[\s\S]*?"""|'''[\s\S]*?'''|#.*)|('(?:\\.|[^'])*')|("(?:\\.|[^"])*")|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*\b)/g;
    return code.replace(pyRegex, (match, mCmt, mStr1, mStr2, mNum, mWord) => {
      if (mCmt) {
        if (match.startsWith("#")) return `<span class="hl-cmt">${match}</span>`;
        return `<span class="hl-str">${match}</span>`;
      }
      if (mStr1 || mStr2) return `<span class="hl-str">${match}</span>`;
      if (mNum) return `<span class="hl-num">${match}</span>`;
      if (mWord) {
        if (kws.has(match)) return `<span class="hl-kw">${match}</span>`;
        return match;
      }
      return match;
    });
  }

  if (sqlLike) {
    const sqlRegex = /(\/\*[\s\S]*?\*\/|--.*)|('(?:\\.|[^'])*')|("(?:\\.|[^"])*")|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*\b)/g;
    return code.replace(sqlRegex, (match, mCmt, mStr1, mStr2, mNum, mWord) => {
      if (mCmt) return `<span class="hl-cmt">${match}</span>`;
      if (mStr1 || mStr2) return `<span class="hl-str">${match}</span>`;
      if (mNum) return `<span class="hl-num">${match}</span>`;
      if (mWord) {
        if (kws.has(match)) return `<span class="hl-kw">${match}</span>`;
        return match;
      }
      return match;
    });
  }

  if (cssLike) {
    const cssRegex = /(\/\*[\s\S]*?\*\/)|('(?:\\.|[^'])*')|("(?:\\.|[^"])*")|(\b\d+(?:\.\d+)?(?:px|em|rem|%|s|ms|vh|vw|pt)?\b)|(\b[a-zA-Z_][-a-zA-Z0-9_]*\b)/g;
    return code.replace(cssRegex, (match, mCmt, mStr1, mStr2, mNum, mWord) => {
      if (mCmt) return `<span class="hl-cmt">${match}</span>`;
      if (mStr1 || mStr2) return `<span class="hl-str">${match}</span>`;
      if (mNum) return `<span class="hl-num">${match}</span>`;
      if (mWord) {
        if (kws.has(match)) return `<span class="hl-kw">${match}</span>`;
        return match;
      }
      return match;
    });
  }

  // Basic/fallback
  const basicRegex = /(\/\*[\s\S]*?\*\/|\/\/.*|#.*)|('(?:\\.|[^'])*')|("(?:\\.|[^"])*")|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*\b)/g;
  return code.replace(basicRegex, (match, mCmt, mStr1, mStr2, mNum, mWord) => {
    if (mCmt) return `<span class="hl-cmt">${match}</span>`;
    if (mStr1 || mStr2) return `<span class="hl-str">${match}</span>`;
    if (mNum) return `<span class="hl-num">${match}</span>`;
    if (mWord) {
      if (kws.has(match)) return `<span class="hl-kw">${match}</span>`;
      return match;
    }
    return match;
  });
}

export function mdToHtml(src: string) {
  if (!src) return "";
  const lines = String(src).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const inline = (t: string) => {
    t = escapeHtml(t);
    t = t.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
    t = t.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, txt, url) => `<a href="${url}" target="_blank" rel="noopener">${txt}</a>`);
    return t;
  };
  while (i < lines.length) {
    const ln = lines[i];
    const codeMatch = ln.match(/^(\s*)(?:```|''')/);
    if (codeMatch) {
      const indent = codeMatch[1];
      const isTripleQuote = ln.trim().startsWith("'''");
      const marker = isTripleQuote ? "'''" : "```";
      const lang = (ln.trim().match(/^(?:```|''')(\w+)/) || [])[1] || "";
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(marker)) {
        let codeLine = lines[i];
        if (codeLine.startsWith(indent)) {
          codeLine = codeLine.substring(indent.length);
        }
        buf.push(escapeHtml(codeLine));
        i++;
      }
      i++;
      const highlighted = highlightCode(buf.join("\n"), lang);
      const langLabel = lang ? ` data-lang="${lang}"` : "";
      out.push(`<pre${langLabel}><code>${highlighted}</code></pre>`);
      continue;
    }
    if (/^\s*$/.test(ln)) {
      i++;
      continue;
    }
    const h = ln.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lv = Math.min(h[1].length, 3);
      out.push(`<h${lv}>${inline(h[2])}</h${lv}>`);
      i++;
      continue;
    }
    if (/^\s*([-*_])\1{0,}\s*$/.test(ln) && ln.replace(/\s/g, "").length >= 3) {
      out.push("<hr>");
      i++;
      continue;
    }
    if (/^>\s?/.test(ln)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(inline(lines[i].replace(/^>\s?/, "")));
        i++;
      }
      out.push(`<blockquote>${buf.join("<br>")}</blockquote>`);
      continue;
    }
    if (/^\s*[-*+]\s+/.test(ln)) {
      const buf = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const item = lines[i].replace(/^\s*[-*+]\s+/, "");
        const cb = item.match(/^\[([ xX])\]\s+(.*)$/);
        if (cb) {
          buf.push(`<li><input type="checkbox" disabled ${cb[1] !== " " ? "checked" : ""}>${inline(cb[2])}</li>`);
        } else {
          buf.push(`<li>${inline(item)}</li>`);
        }
        i++;
      }
      out.push(`<ul>${buf.join("")}</ul>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(ln)) {
      const buf = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        buf.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${buf.join("")}</ol>`);
      continue;
    }
    if (ln.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const parse = (r: string) => r.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      const head = parse(ln);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(parse(lines[i]));
        i++;
      }
      out.push(`<table><thead><tr>${head.map(h => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }
    const buf = [];
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,6}\s|>\s?|\s*[-*+]\s|\s*\d+\.\s)/.test(lines[i]) && !/^\s*(?:```|''')/.test(lines[i])) {
      buf.push(inline(lines[i]));
      i++;
    }
    out.push(`<p>${buf.join("<br>")}</p>`);
  }
  return out.join("\n");
}

export function wordCount(s: string) {
  return (String(s || "").trim().match(/\S+/g) || []).length;
}

export function readTime(s: string) {
  return Math.max(1, Math.ceil(wordCount(s) / 200));
}

export function download(filename: string, text: string, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const PRIORITY: Record<string, { label: string; color: string; bars: number; rank: number }> = {
  low: { label: "Low", color: "var(--p-low)", bars: 1, rank: 0 },
  medium: { label: "Medium", color: "var(--p-med)", bars: 2, rank: 1 },
  high: { label: "High", color: "var(--p-high)", bars: 3, rank: 2 },
  critical: { label: "Critical", color: "var(--p-crit)", bars: 3, rank: 3 },
};

export const STATUS: Record<string, { label: string; color: string }> = {
  todo: { label: "Todo", color: "#8b8b94" },
  progress: { label: "In Progress", color: "#3b82f6" },
  review: { label: "In Review", color: "#a855f7" },
  done: { label: "Done", color: "#22c55e" },
};

export const STATUS_ORDER = ["todo", "progress", "review", "done"];
export const PROJECT_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#06b6d4", "#eab308", "#ef4444", "#8b5cf6", "#14b8a6"];
export const COLUMN_COLORS = ["#8b8b94", "#3b82f6", "#a855f7", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#14b8a6", "#f97316"];

export function defaultColumns() {
  return [
    { id: "todo", name: "Todo", color: "#8b8b94", done: false },
    { id: "progress", name: "In Progress", color: "#3b82f6", done: false },
    { id: "review", name: "In Review", color: "#a855f7", done: false },
    { id: "done", name: "Done", color: "#22c55e", done: true },
  ];
}

export function getColumns(project: any) {
  return (project && Array.isArray(project.columns) && project.columns.length) ? project.columns : defaultColumns();
}

export function getColumn(project: any, statusId: string) {
  const cols = getColumns(project);
  return cols.find((c: any) => c.id === statusId) || cols[0] || { id: statusId, name: String(statusId), color: "#8b8b94", done: false };
}

export function isDoneStatus(project: any, statusId: string) {
  return !!getColumn(project, statusId).done;
}

export function firstStatus(project: any) {
  return getColumns(project)[0]?.id || "todo";
}

export function doneStatus(project: any) {
  const cols = getColumns(project);
  return (cols.find((c: any) => c.done) || cols[cols.length - 1])?.id || "done";
}

export function projectOf(state: any, task: any) {
  return state.projects.find((p: any) => p.id === task.projectId);
}

export function colOf(state: any, task: any) {
  return getColumn(projectOf(state, task), task.status);
}

export function isTaskDone(state: any, task: any) {
  return isDoneStatus(projectOf(state, task), task.status);
}

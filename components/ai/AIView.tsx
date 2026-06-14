'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Icon } from '@/components/Icon'
import {
  Empty,
  PriorityBadge,
  toast
} from '@/components/ui'
import { cx, getColumn, isDoneStatus, uid } from '@/lib/utils'
import { Store, useStoreFull, useStore } from '@/lib/store'

export function buildPlanPrompt(project: any, modules: any[], tasks: any[]) {
  const mlist = modules.length ? modules.map(m => `- ${m.name}`).join("\n") : "(none yet)";
  const open = tasks.filter(t => !isDoneStatus(project, t.status));
  const tlist = open.length ? open.slice(0, 30).map(t => `- [${getColumn(project, t.status).name}] ${t.title} (${t.priority})`).join("\n") : "(none yet)";
  return `You are a senior engineering planner helping a solo developer break down work.

PROJECT: ${project.name}
DESCRIPTION: ${project.description || "(no description)"}

EXISTING MODULES:
${mlist}

CURRENT OPEN TASKS:
${tlist}

TASK: Propose a concrete next-phase plan that moves this project forward. Identify the right modules (reuse existing names where they fit), break them into tasks, and also suggest relevant documents (specs, guides, checklists) that should be created.

OUTPUT FORMAT — return ONLY markdown in exactly this shape, no preamble:

## MODULE: Module Name
DESCRIPTION: A brief description of the module.

### TASK: Task Title
PRIORITY: critical/high/medium/low
STATUS: TODO
TAGS: tag1, tag2
DESCRIPTION: A brief 1-2 sentence description explaining the objective of this task.
- Checklist item 1
- Checklist item 2

### DOC: Document Title
CONTENT:
Detailed description or outline of what should be documented in this guide or reference. Include subheadings or bullet points if necessary.

Rules:
- priority is one of: low, medium, high, critical
- keep task titles short and action-oriented (start with a verb)
- 2–5 tasks per module, 1-2 docs per module, 2–4 modules total
- do not number tasks or docs`;
}

export function parsePlan(md: string) {
  const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
  const mods: any[] = [];
  let curMod: any = null;
  let curTask: any = null;
  let curDoc: any = null;

  const prio = (s: string) => {
    const m = s.match(/\(?\b(low|medium|high|critical)\b\)?\s*$/i);
    if (m) return { title: s.slice(0, m.index).replace(/[—\-(:]\s*$/, "").trim(), priority: m[1].toLowerCase() };
    return { title: s.trim(), priority: "medium" };
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      if (curDoc) {
        curDoc.content += "\n";
      }
      continue;
    }

    // 1. Module header: ## MODULE: Module Name OR ## Module Name
    const h2 = raw.match(/^##\s+MODULE:\s*(.*)$/i) || (!curDoc && raw.match(/^##\s+(?!#)(.*)$/));
    if (h2) {
      curMod = { name: h2[1].replace(/[:*]/g, "").trim(), description: "", tasks: [], docs: [] };
      mods.push(curMod);
      curTask = null;
      curDoc = null;
      continue;
    }

    // 2. Doc header: ### DOC: Doc Title
    const docMatch = raw.match(/^###\s+DOC:\s*(.*)$/i);
    if (docMatch) {
      if (!curMod) {
        curMod = { name: "General", description: "", tasks: [], docs: [] };
        mods.push(curMod);
      }
      curDoc = { title: docMatch[1].trim(), content: "" };
      curMod.docs.push(curDoc);
      curTask = null;
      continue;
    }

    // 3. Task header: ### TASK: Task Title OR ### Task Title
    const h3 = raw.match(/^###\s+TASK:\s*(.*)$/i) || (!curDoc && !docMatch && raw.match(/^###\s+(?!#)(.*)$/));
    if (h3) {
      if (!curMod) {
        curMod = { name: "General", description: "", tasks: [], docs: [] };
        mods.push(curMod);
      }
      const rawTitle = h3[1].replace(/^\[[ xX]\]\s*/, "").replace(/\*\*/g, "").trim();
      const { title, priority } = prio(rawTitle);
      curTask = { title, priority, description: "", tags: [], status: "todo", subtasks: [] };
      curMod.tasks.push(curTask);
      curDoc = null;
      continue;
    }

    // 4. If we are parsing a document, all lines append to the doc content until we hit the next header
    if (curDoc) {
      // If the line starts with CONTENT:, we strip that prefix
      const contentMatch = raw.match(/^\s*CONTENT:\s*(.*)$/i);
      if (contentMatch) {
        curDoc.content += contentMatch[1] + "\n";
      } else {
        curDoc.content += raw + "\n";
      }
      continue;
    }

    // 5. Priority: PRIORITY: high
    const prioMatch = line.match(/^PRIORITY:\s*(.*)$/i);
    if (prioMatch && curTask) {
      const p = prioMatch[1].toLowerCase().trim();
      if (["low", "medium", "high", "critical"].includes(p)) {
        curTask.priority = p;
      }
      continue;
    }

    // 6. Status: STATUS: TODO
    const statusMatch = line.match(/^STATUS:\s*(.*)$/i);
    if (statusMatch && curTask) {
      curTask.status = statusMatch[1].trim();
      continue;
    }

    // 7. Tags: TAGS: backend, setup
    const tagsMatch = line.match(/^TAGS:\s*(.*)$/i);
    if (tagsMatch && curTask) {
      curTask.tags = tagsMatch[1].split(",").map(t => t.trim()).filter(Boolean);
      continue;
    }

    // 8. Description: DESCRIPTION: ...
    const descMatch = line.match(/^DESCRIPTION:\s*(.*)$/i);
    if (descMatch) {
      if (curTask) {
        curTask.description = descMatch[1].trim();
      } else if (curMod) {
        curMod.description = descMatch[1].trim();
      }
      continue;
    }

    // 9. Checklist item for task: - Item
    const li = line.match(/^[-*+]\s+(.*)$/);
    if (li && curTask) {
      const txt = li[1].replace(/^\[[ xX]\]\s*/, "").trim();
      if (txt) {
        curTask.subtasks.push({ id: uid("s_"), text: txt, done: false });
      }
      continue;
    }
  }

  // Post-process docs content: trim whitespace
  mods.forEach(m => {
    m.docs.forEach((d: any) => {
      d.content = d.content.trim();
      if (!d.content) {
        d.content = `# ${d.title}\n\n`;
      }
    });
  });

  return mods.filter(m => m.tasks.length || m.docs.length);
}

interface AIViewProps {
  projectId: string;
}

export function AIView({ projectId }: AIViewProps) {
  const state = useStoreFull();
  const projects = state.projects.filter((p: any) => !p.archived);
  const [pid, setPid] = useState(projectId !== "all" ? projectId : projects[0]?.id);
  useEffect(() => { if (projectId !== "all") setPid(projectId); }, [projectId]);
  const project = state.projects.find((p: any) => p.id === pid) || projects[0];
  const modules = state.modules.filter((m: any) => m.projectId === project?.id);
  const tasks = state.tasks.filter((t: any) => t.projectId === project?.id);

  const [prompt, setPrompt] = useState("");
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [over, setOver] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [model, setModel] = useState("gemini");
  const [modelsList, setModelsList] = useState<string[]>(["gemini", "grok"]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (project) setPrompt(buildPlanPrompt(project, modules, tasks)); /* eslint-disable-next-line */ }, [pid]);

  useEffect(() => {
    async function loadModels() {
      try {
        const pin = localStorage.getItem('devboard_pin') || '';
        const res = await fetch("/api/ai/models", {
          headers: {
            'x-devboard-pin': pin
          }
        });
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            const list = json.data.map((m: any) => m.id);
            if (list.length > 0) {
              setModelsList(list);
              if (!list.includes(model)) {
                setModel(list[0]);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load models dynamically:", e);
      }
    }
    loadModels();
  }, []);

  const copy = async () => { try { await navigator.clipboard.writeText(prompt); toast("Prompt copied to clipboard", "success"); } catch { toast("Copy failed", "error"); } };

  const runAI = async () => {
    setLoading(true); setRaw(""); setParsed(null); setSummary(null);
    try {
      const pin = localStorage.getItem('devboard_pin') || '';
      const response = await fetch("/api/ai/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-devboard-pin": pin
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: "You are a senior engineering planner helping a solo developer break down work." },
            { role: "user", content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      if (!text) {
        throw new Error("No response content returned from AI model");
      }
      setRaw(text);
      setParsed(parsePlan(text));
      toast("Plan generated", "success");
    } catch (e: any) {
      toast("AI request failed: " + (e.message || e), "error");
    }
    setLoading(false);
  };

  const onFile = (file: File | null) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { const text = String(r.result); setRaw(text); setParsed(parsePlan(text)); setSummary(null); toast("File parsed", "success"); };
    r.readAsText(file);
  };

  const doImport = () => {
    if (!parsed?.length || !project) return;
    let nMods = 0, nTasks = 0, nDocs = 0;
    parsed.forEach(pm => {
      let mod = state.modules.find((m: any) => m.projectId === project.id && m.name.toLowerCase() === pm.name.toLowerCase());
      const hasTasks = pm.tasks && pm.tasks.length > 0;
      const hasDocs = pm.docs && pm.docs.length > 0;
      
      if ((hasTasks || hasDocs) && !mod) {
        mod = Store.addModule(project.id, pm.name);
        nMods++;
      }
      
      if (hasTasks && mod) {
        pm.tasks.forEach((t: any) => { 
          Store.addTask({ 
            projectId: project.id, 
            moduleId: mod.id, 
            title: t.title, 
            priority: t.priority,
            description: t.description || "",
            tags: t.tags || [],
            status: t.status || "todo",
            subtasks: t.subtasks || []
          }); 
          nTasks++; 
        });
      }

      if (hasDocs) {
        pm.docs.forEach((d: any) => {
          Store.addDoc(project.id, d.title, d.content);
          nDocs++;
        });
      }
    });
    setSummary({ nMods, nTasks, nDocs });
    setParsed(null); setRaw("");
    let msg = `Imported ${nTasks} tasks`;
    if (nDocs > 0) msg += ` and ${nDocs} documents`;
    toast(msg, "success");
  };

  const totalTasks = parsed ? parsed.reduce((a, m) => a + m.tasks.length, 0) : 0;
  const totalDocs = parsed ? parsed.reduce((a, m) => a + (m.docs?.length || 0), 0) : 0;

  return (
    <div className="wrap">
      <div className="page-head">
        <div>
          <h1 className="flex aic gap8"><Icon name="ai" style={{ color: "var(--accent)" }} />AI Planner</h1>
          <p>Turn project context into a structured plan — generate live, or bring your own AI response and import it.</p>
        </div>
        <select className="select" style={{ width: 200 }} value={pid} onChange={(e) => setPid(e.target.value)}>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="ai-grid">
        {/* STEP 1 — prompt */}
        <div className="ai-step">
          <div className="sh"><div className="sn">1</div><div><h3>Planning prompt</h3><div className="desc">Built from {project?.name}'s modules & open tasks</div></div></div>
          <div className="prompt-box">{prompt}</div>
          <div className="flex aic gap8 mt12">
            <button className="btn btn-default btn-sm" onClick={copy}><Icon name="copy" />Copy prompt</button>
            <select 
              className="select" 
              style={{ minWidth: 110, height: 32, padding: "0 8px", fontSize: 13 }}
              value={model} 
              onChange={(e) => setModel(e.target.value)}
            >
              {modelsList.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={runAI} disabled={loading}>
              {loading ? <><Icon name="refresh" className="spin" />Generating…</> : <><Icon name="zap" />Generate plan</>}
            </button>
          </div>
        </div>

        {/* STEP 2 — response / upload */}
        <div className="ai-step">
          <div className="sh"><div className="sn">2</div><div><h3>AI response</h3><div className="desc">Generated here, or upload a .md you got elsewhere</div></div></div>
          {!raw && !loading && (
            <div className={cx("dropzone", over && "over")} onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files[0]); }}>
              <Icon name="upload" />
              <div style={{ fontWeight: 500 }}>Drop a .md file or click to upload</div>
              <div style={{ fontSize: 12, marginTop: 3 }}>…or hit “Generate plan” to do it live</div>
              <input ref={fileRef} type="file" accept=".md,.markdown,.txt" hidden onChange={(e: any) => onFile(e.target.files[0])} />
            </div>
          )}
          {loading && <div className="dropzone"><Icon name="refresh" className="spin" /><div>Thinking…</div></div>}
          {raw && <div className="prompt-box" style={{ color: "var(--text)" }}>{raw}</div>}
          {raw && <button className="btn btn-ghost btn-sm mt12" onClick={() => { setRaw(""); setParsed(null); }}><Icon name="reset" />Clear</button>}
        </div>
      </div>

      {/* STEP 3 — preview & import */}
      {parsed && (
        <div className="ai-step mt16 fade-in">
          <div className="sh">
            <div className="sn">3</div>
            <div>
              <h3>Preview plan</h3>
              <div className="desc">
                {parsed.length} module{parsed.length !== 1 ? "s" : ""} · {totalTasks} tasks · {totalDocs} document{totalDocs !== 1 ? "s" : ""} — review before importing into {project?.name}
              </div>
            </div>
          </div>
          <div className="grid-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {parsed.map((m, i) => (
              <div key={i} className="card" style={{ padding: 14 }}>
                <div className="flex aic gap8 mb12">
                  <Icon name="cube" style={{ width: 15, color: "var(--accent)" }} />
                  <b style={{ fontSize: 13.5 }}>{m.name}</b>
                  <span className="badge" style={{ marginLeft: "auto" }}>
                    {(m.tasks?.length || 0) + (m.docs?.length || 0)} items
                  </span>
                </div>
                {m.description && (
                  <p className="dim mb12" style={{ fontSize: 12, fontStyle: "italic", borderBottom: "1px solid var(--border-subtle)", paddingBottom: 8 }}>
                    {m.description}
                  </p>
                )}
                
                {m.tasks && m.tasks.length > 0 && (
                  <div className="mb12">
                    <div className="dim mb4" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tasks</div>
                    {m.tasks.map((t: any, j: number) => (
                      <div key={j} style={{ padding: "8px 0", borderBottom: j < m.tasks.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                        <div className="flex aic gap8" style={{ fontSize: 13, fontWeight: 500 }}>
                          <PriorityBadge priority={t.priority} withLabel={false} />
                          <span style={{ wordBreak: "break-word" }}>{t.title}</span>
                          {t.tags && t.tags.map((tag: string, k: number) => (
                            <span key={k} className="badge" style={{ fontSize: 9, padding: "1px 4px", opacity: 0.8, flexShrink: 0 }}>{tag}</span>
                          ))}
                        </div>
                        {t.description && <div className="dim" style={{ fontSize: 11.5, marginTop: 4, paddingLeft: 16 }}>{t.description}</div>}
                        {t.subtasks && t.subtasks.length > 0 && (
                          <div className="dim" style={{ fontSize: 11, marginTop: 6, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 2 }}>
                            {t.subtasks.map((st: any, k: number) => (
                              <div key={k} className="flex aic gap4">
                                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--text-dim)", display: "inline-block" }} />
                                <span>{st.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {m.docs && m.docs.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: m.tasks && m.tasks.length > 0 ? "1px solid var(--border-subtle)" : "none" }}>
                    <div className="dim mb4" style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Documents</div>
                    {m.docs.map((d: any, j: number) => (
                      <div key={j} style={{ padding: "6px 0", display: "flex", flexDirection: "column", gap: 2 }}>
                        <div className="flex aic gap6" style={{ fontSize: 12.5, fontWeight: 500 }}>
                          <Icon name="doc" style={{ width: 13, height: 13, color: "var(--accent)" }} />
                          <span style={{ wordBreak: "break-word" }}>{d.title}</span>
                        </div>
                        {d.content && (
                          <div className="dim" style={{ fontSize: 11, paddingLeft: 19, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {d.content.replace(/^#\s+.*?\n/, "").trim().slice(0, 60) || "Empty document template"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex aic gap8 mt16">
            <button className="btn btn-primary" onClick={doImport}>
              <Icon name="download" />Import Plan ({totalTasks} tasks, {totalDocs} docs)
            </button>
            <button className="btn btn-ghost" onClick={() => setParsed(null)}>Discard</button>
          </div>
        </div>
      )}

      {summary && (
        <div className="ai-step mt16 fade-in" style={{ borderColor: "var(--s-done)" }}>
          <div className="flex aic gap10">
            <div className="sn" style={{ background: "rgba(34,197,94,.15)", color: "var(--s-done)" }}><Icon name="check" /></div>
            <div>
              <h3>Import complete</h3>
              <div className="desc">
                Added {summary.nTasks} tasks{summary.nDocs ? ` and ${summary.nDocs} documents` : ""}{summary.nMods ? ` across ${summary.nMods} new module${summary.nMods !== 1 ? "s" : ""}` : ""} to {project?.name}.
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setSummary(null)}><Icon name="x" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Icon } from '@/components/Icon'
import {
  Empty,
  Markdown,
  useConfirm,
  toast
} from '@/components/ui'
import {
  cx,
  relTime,
  wordCount,
  readTime,
  download
} from '@/lib/utils'
import { useStoreFull, Store } from '@/lib/store'

interface DocsViewProps {
  projectId: string;
}

export function DocsView({ projectId }: DocsViewProps) {
  const state = useStoreFull();
  const docs = useMemo(() => state.docs
    .filter((d: any) => projectId === "all" || d.projectId === projectId)
    .sort((a: any, b: any) => b.updatedAt - a.updatedAt), [state.docs, projectId]);
  const [selId, setSelId] = useState<string | null>(docs[0]?.id || null);
  const [confirm, confirmNode] = useConfirm();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const doc = docs.find((d: any) => d.id === selId) || docs[0];

  const [model, setModel] = useState("gemini");
  const [modelsList, setModelsList] = useState<string[]>(["gemini", "grok"]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [docMode, setDocMode] = useState<'edit' | 'preview'>('preview');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(() => {
    return new Set(state.projects.map((p: any) => p.id));
  });

  const toggleProject = (pid: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  useEffect(() => {
    setDocMode('preview');
  }, [selId]);

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

  const handleAIAssist = async () => {
    if (!aiPrompt.trim() || !doc) return;
    const promptToSend = aiPrompt;
    setAiPrompt("");
    setChatHistory(prev => [...prev, { role: "user", content: promptToSend }]);
    setAiLoading(true);
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
            {
              role: "system",
              content: `You are an expert technical writer helping a developer write and refine documentation.
You will receive a document's title, its current markdown content, and a user's request.
Modify or write the content based on the request.
Return the full updated markdown content of the document.
Do not include any chat preamble, markdown blocks wrapping the entire response (like \`\`\`markdown ... \`\`\`), or additional commentary. Just return the updated markdown text directly.`
            },
            {
              role: "user",
              content: `Document Title: ${doc.title}
Current Content:
${doc.content}

User Request: ${promptToSend}`
            }
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

      let cleanText = text.trim();
      if (cleanText.startsWith("```markdown")) {
        cleanText = cleanText.substring(11);
      } else if (cleanText.startsWith("```")) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith("```")) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();

      Store.updateDoc(doc.id, { content: cleanText });
      setChatHistory(prev => [...prev, { role: "assistant", content: `I have updated the document based on your request: "${promptToSend}"` }]);
      toast("Document updated by AI", "success");
    } catch (e: any) {
      setChatHistory(prev => [...prev, { role: "assistant", content: `Error: ${e.message || e}` }]);
      toast("AI document helper failed: " + (e.message || e), "error");
    }
    setAiLoading(false);
  };

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, aiLoading, isChatOpen]);

  useEffect(() => { if (!docs.find((d: any) => d.id === selId)) setSelId(docs[0]?.id || null); }, [docs, selId]);

  const create = () => {
    const pid = projectId === "all" ? state.projects.find((p: any) => !p.archived)?.id : projectId;
    if (!pid) { toast("Create a project first", "error"); return; }
    const d = Store.addDoc(pid, "Untitled");
    setSelId(d.id); toast("Doc created", "success");
  };
  const del = async (d: any) => {
    if (await confirm({ title: "Delete doc?", message: `“${d.title}” will be permanently removed.`, danger: true, confirmText: "Delete" })) {
      Store.deleteDoc(d.id); toast("Doc deleted", "success");
    }
  };

  const apply = (pre: string, suf = pre, block?: boolean) => {
    const ta = taRef.current; if (!ta || !doc) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const text = doc.content || "", sel = text.slice(s, e);
    let next, cursor;
    if (block) { next = text.slice(0, s) + pre + sel + text.slice(e); cursor = s + pre.length + sel.length; }
    else { next = text.slice(0, s) + pre + (sel || "text") + suf + text.slice(e); cursor = s + pre.length + (sel || "text").length; }
    Store.updateDoc(doc.id, { content: next });
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + pre.length, cursor); });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (doc) toast("Saved", "success"); }
      if (doc && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); apply("**"); }
      if (doc && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") { e.preventDefault(); apply("*"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc]);

  const tools = [
    { icon: "heading", tip: "Heading", fn: () => apply("## ", "", true) },
    { icon: "bold", tip: "Bold ⌘B", fn: () => apply("**") },
    { icon: "italic", tip: "Italic ⌘I", fn: () => apply("*") },
    { icon: "code", tip: "Code", fn: () => apply("`") },
    { sep: true },
    { icon: "list", tip: "List", fn: () => apply("- ", "", true) },
    { icon: "quote", tip: "Quote", fn: () => apply("> ", "", true) },
    { icon: "link", tip: "Link", fn: () => apply("[", "](url)") },
  ];

  const docProj = state.projects.find((p: any) => p.id === doc?.projectId);

  return (
    <div className="docs-layout">
      <div className="docs-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <button className="btn btn-default btn-sm btn-block" onClick={create}><Icon name="plus" />New doc</button>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }} className="sb-scroll">
          {state.projects.filter((p: any) => !p.archived).map((proj: any) => {
            const projDocs = docs.filter((d: any) => d.projectId === proj.id);
            const isExpanded = expandedProjects.has(proj.id);
            
            return (
              <div key={proj.id} className="proj-doc-drawer" style={{ display: 'flex', flexDirection: 'column' }}>
                <div 
                  onClick={() => toggleProject(proj.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontWeight: 600,
                    fontSize: 12,
                    color: 'var(--text-2)',
                    background: 'var(--bg-2)'
                  }}
                  className="proj-drawer-header"
                >
                  <Icon 
                    name="chevron" 
                    style={{ 
                      width: 12, 
                      height: 12, 
                      transition: 'transform 0.15s ease', 
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' 
                    }} 
                  />
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: proj.color, flex: 'none' }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</span>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const d = Store.addDoc(proj.id, "Untitled");
                      setSelId(d.id); 
                      setExpandedProjects(prev => {
                        const next = new Set(prev);
                        next.add(proj.id);
                        return next;
                      });
                      toast(`Doc created under ${proj.name}`, "success");
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: 2,
                      cursor: 'pointer',
                      color: 'var(--text-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2
                    }}
                    title="Add doc directly to this project"
                  >
                    <Icon name="plus" style={{ width: 12, height: 12 }} />
                  </button>
                  
                  <span style={{ fontSize: 10, opacity: 0.6, background: 'var(--bg-3)', padding: '1px 5px', borderRadius: 10 }}>{projDocs.length}</span>
                </div>
                
                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 12, marginTop: 4, gap: 2 }}>
                    {projDocs.length === 0 ? (
                      <div className="faint" style={{ fontSize: 11.5, padding: '6px 12px', fontStyle: 'italic' }}>
                        No docs
                      </div>
                    ) : (
                      projDocs.map((d: any) => (
                        <div 
                          key={d.id} 
                          className={cx("di", d.id === selId && "active")} 
                          onClick={() => setSelId(d.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                          }}
                        >
                          <div className="t" style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {d.title || "Untitled"}
                          </div>
                          <div className="m" style={{ fontSize: 10, color: 'var(--text-3)' }}>
                            {relTime(d.updatedAt)} · {wordCount(d.content)} words
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {doc ? (
        <div className="docs-editor" style={{ position: 'relative' }}>
          <div className="docs-toolbar">
            {docProj && (
              <div className="flex aic gap6 faint mr8" style={{ fontSize: 13, userSelect: 'none', flexShrink: 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: docProj.color, display: 'inline-block' }} />
                <span style={{ fontWeight: 500 }}>{docProj.name}</span>
                <span style={{ opacity: 0.5 }}>/</span>
              </div>
            )}
            <input className="td-title" style={{ fontSize: 15, fontWeight: 600, flex: 1, marginRight: 8 }} value={doc.title}
              onChange={(e) => Store.updateDoc(doc.id, { title: e.target.value })} placeholder="Untitled" />
            <div className="seg" style={{ marginRight: 6 }}>
              <button className={cx(docMode === 'edit' && 'on')} onClick={() => setDocMode('edit')}>
                <Icon name="edit" style={{ width: 13, height: 13 }} /><span style={{ fontSize: 12 }}>Edit</span>
              </button>
              <button className={cx(docMode === 'preview' && 'on')} onClick={() => setDocMode('preview')}>
                <Icon name="eye" style={{ width: 13, height: 13 }} /><span style={{ fontSize: 12 }}>Preview</span>
              </button>
            </div>
            {docMode === 'edit' && (<>
              {tools.map((t, i) => t.sep ? <div key={i} className="gap" /> : (
                <button key={i} className="tb-btn tip" data-tip={t.tip} onClick={t.fn}><Icon name={t.icon || ""} /></button>
              ))}
              <div className="gap" />
            </>)}
            <button className="tb-btn tip" data-tip="Export .md" onClick={() => { download((doc.title || "doc") + ".md", doc.content, "text/markdown"); toast("Exported .md", "success"); }}><Icon name="download" /></button>
            <button className="tb-btn tip" data-tip="Delete" onClick={() => del(doc)}><Icon name="trash" /></button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {docMode === 'edit' ? (
              <div className="docs-pane edit" style={{ flex: 1, overflow: 'auto', borderRight: 'none' }}>
                <textarea ref={taRef} value={doc.content} placeholder="Start writing in markdown…"
                  onChange={(e) => Store.updateDoc(doc.id, { content: e.target.value })} spellCheck={false} />
              </div>
            ) : (
              <div className="docs-pane" style={{ flex: 1, overflow: 'auto' }}>
                <Markdown source={doc.content} />
              </div>
            )}
          </div>
          
          {/* Floating AI Assistant Trigger Button */}
          <button
            className="btn btn-primary"
            style={{
              position: 'absolute',
              bottom: 48,
              right: 20,
              width: 42,
              height: 42,
              borderRadius: '50%',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              zIndex: 99,
              border: '1px solid var(--accent)'
            }}
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <Icon name="ai" style={{ width: 20, height: 20 }} />
          </button>

          {/* Hovering AI Assistant Pop-Up */}
          {isChatOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                bottom: 100,
                right: 20,
                width: 350,
                maxHeight: 450,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-pop)',
                zIndex: 100,
                background: 'var(--panel)',
                border: '1px solid var(--border-2)',
                borderRadius: 12,
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-2)',
                  background: 'var(--bg-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="ai" style={{ color: 'var(--accent)', width: 16, height: 16 }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>AI Doc Assistant</span>
                </div>
                <button
                  className="tb-btn"
                  style={{ padding: 4 }}
                  onClick={() => setIsChatOpen(false)}
                >
                  <Icon name="x" style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {/* Chat Messages */}
              <div
                style={{
                  flex: 1,
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxHeight: 280,
                  fontSize: 12.5
                }}
              >
                <div style={{ color: 'var(--text-3)', fontStyle: 'italic', fontSize: 11.5, textAlign: 'center', marginBottom: 4 }}>
                  Editing: <strong>{doc.title || "Untitled"}</strong>
                </div>

                {chatHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-3)', marginTop: 20 }}>
                    <Icon name="message" style={{ width: 32, height: 32, opacity: 0.3, margin: '0 auto 8px' }} />
                    <p>Ask AI to write sections, edit grammar, or generate boilerplate code for this doc.</p>
                  </div>
                ) : (
                  chatHistory.map((msg: any, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-3)',
                        color: msg.role === 'user' ? '#fff' : 'var(--text)',
                        padding: '8px 12px',
                        borderRadius: 8,
                        maxWidth: '85%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.content}
                    </div>
                  ))
                )}
                {aiLoading && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      background: 'var(--bg-3)',
                      color: 'var(--text-3)',
                      padding: '8px 12px',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Icon name="refresh" className="spin" style={{ width: 12, height: 12 }} />
                    <span>AI is writing...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div
                style={{
                  padding: '12px',
                  borderTop: '1px solid var(--border-2)',
                  background: 'var(--bg-2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', gap: 6 }}>
                  <select
                    className="select"
                    style={{ flex: 1, height: 28, fontSize: 11.5, padding: '0 4px' }}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={aiLoading}
                  >
                    {modelsList.map((m) => (
                      <option key={m} value={m}>
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </option>
                    ))}
                  </select>
                  {chatHistory.length > 0 && (
                    <button
                      className="btn btn-default btn-xs"
                      style={{ height: 28, fontSize: 11 }}
                      onClick={() => setChatHistory([])}
                      disabled={aiLoading}
                    >
                      Clear Chat
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="input"
                    style={{ flex: 1, height: 32, fontSize: 12.5 }}
                    placeholder="Ask AI to modify this document..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAIAssist(); }}
                    disabled={aiLoading}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ height: 32, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={handleAIAssist}
                    disabled={aiLoading || !aiPrompt.trim()}
                  >
                    <Icon name="arrowRight" style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="docs-statusbar">
            <span><Icon name="check" style={{ width: 12, height: 12, verticalAlign: "-2px", color: "var(--s-done)" }} /> Saved · auto</span>
            <span>{wordCount(doc.content)} words</span>
            <span>{readTime(doc.content)} min read</span>
            <span style={{ marginLeft: "auto" }} className="faint"><kbd>⌘</kbd> <kbd>S</kbd> to save</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", placeItems: "center", width: '100%' }}>
          <Empty icon="doc" title="No documents" sub="Capture specs, notes, and decisions alongside your tasks."
            action={<button className="btn btn-primary btn-sm" onClick={create}><Icon name="plus" />New doc</button>} />
        </div>
      )}
      {confirmNode}
    </div>
  );
}

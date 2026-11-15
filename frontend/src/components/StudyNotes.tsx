"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, ChevronDown, Code2, Highlighter, Italic, List, ListOrdered, Quote, Redo2, Save, Search, Trash2, Undo2 } from "lucide-react";

type Note = { id: string; workspace: string; text: string; html?: string; updated: string };
const STORAGE_KEY = "orbital-study-notes-v1";
const SAFE_TAGS = new Set(["P", "DIV", "BR", "STRONG", "B", "EM", "I", "MARK", "H3", "UL", "OL", "LI", "BLOCKQUOTE", "CODE", "PRE"]);

function sanitizeNoteHtml(html: string) {
  const document = new DOMParser().parseFromString(html, "text/html");
  const clean = (node: Node): Node[] => {
    if (node.nodeType === Node.TEXT_NODE) return [document.createTextNode(node.textContent || "")];
    if (!(node instanceof Element)) return [];
    const children = Array.from(node.childNodes).flatMap(clean);
    const hasHighlight = Boolean((node as HTMLElement).style.backgroundColor);
    if (!SAFE_TAGS.has(node.tagName) && !hasHighlight) return children;
    const element = document.createElement(hasHighlight ? "mark" : node.tagName.toLowerCase());
    children.forEach((child) => element.appendChild(child));
    return [element];
  };
  const container = document.createElement("div");
  Array.from(document.body.childNodes).flatMap(clean).forEach((node) => container.appendChild(node));
  return container.innerHTML;
}

function legacyNoteHtml(text: string) {
  const escaped = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return escaped.replace(/==([^=]+)==/g, "<mark>$1</mark>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
}

export default function StudyNotes({ workspace }: { workspace: "Explore" | "Studio" }) {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [query, setQuery] = useState("");
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the browser-only notes after hydration to keep server/client markup identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setNotes(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); } catch { setNotes([]); }
  }, []);

  const persist = (updated: Note[], announceSaved = false) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      setStorageError("Could not save notes in this browser. Check available storage and try again.");
      return false;
    }
    setNotes(updated);
    setStorageError(null);
    setSaved(announceSaved);
    if (announceSaved) window.setTimeout(() => setSaved(false), 1600);
    return true;
  };

  const formatSelection = (command: string, value?: string) => {
    const field = editor.current;
    if (!field) return;
    const selection = window.getSelection();
    const activeNode = selection?.anchorNode;
    const activeElement = activeNode instanceof Element ? activeNode : activeNode?.parentElement;

    if (command === "hiliteColor") {
      const existingHighlight = activeElement?.closest("mark, [style*='background']");
      if (existingHighlight && field.contains(existingHighlight)) {
        const parent = existingHighlight.parentNode;
        if (parent) {
          while (existingHighlight.firstChild) parent.insertBefore(existingHighlight.firstChild, existingHighlight);
          parent.removeChild(existingHighlight);
        }
      } else {
        field.focus();
        const highlightColor = document.documentElement.classList.contains("dark") ? "#166534" : "#FDE68A";
        const applied = document.execCommand(command, false, highlightColor);
        if (!applied) document.execCommand("backColor", false, highlightColor);
      }
    } else if (command === "formatBlock") {
      const blockTag = value?.replace(/[<>]/g, "").toLowerCase();
      const existingBlock = blockTag ? activeElement?.closest(blockTag) : null;
      field.focus();
      document.execCommand(command, false, existingBlock && field.contains(existingBlock) ? "<p>" : value);
    } else {
      field.focus();
      document.execCommand(command, false, value);
    }
    if (editor.current) setText(editor.current.innerText.trim());
  };

  const saveNote = () => {
    if (!text.trim()) return;
    const html = sanitizeNoteHtml(editor.current?.innerHTML || "");
    const updated = [{ id: crypto.randomUUID(), workspace, text: text.trim(), html, updated: new Date().toISOString() }, ...notes];
    if (!persist(updated, true)) return;
    setText("");
    if (editor.current) editor.current.innerHTML = "";
  };

  const tools = [
    { label: "Undo", icon: Undo2, command: "undo" },
    { label: "Redo", icon: Redo2, command: "redo" },
    { label: "Bold", icon: Bold, command: "bold" },
    { label: "Italic", icon: Italic, command: "italic" },
    { label: "Highlight", icon: Highlighter, command: "hiliteColor" },
    { label: "Bullets", icon: List, command: "insertUnorderedList" },
    { label: "Numbered list", icon: ListOrdered, command: "insertOrderedList" },
    { label: "Quote", icon: Quote, command: "formatBlock", value: "<blockquote>" },
    { label: "Code", icon: Code2, command: "formatBlock", value: "<pre>" },
  ];

  const visibleNotes = notes.filter((note) => `${note.workspace} ${note.text}`.toLowerCase().includes(query.trim().toLowerCase()));

  return <section className="w-full min-w-0 rounded-sm border border-[#E7E7E4] dark:border-[#26282E] bg-[#FFFFFF] dark:bg-[#12141A] p-3 shadow-xs" aria-label={`${workspace} study notes`}>
    <div className="flex items-center justify-between gap-2"><div className="min-w-0"><span className="font-mono-sci text-[9px] uppercase tracking-widest text-[#0284C7]">{workspace} workspace</span><h2 className="truncate font-editorial text-lg">Study Notes</h2></div><span className="shrink-0 font-mono-sci text-[9px] text-[#8A8A83]">{notes.filter((note) => note.workspace === workspace).length} SAVED</span></div>
    <p className="mt-1 text-[11px] leading-relaxed text-[#737373]">Private to this browser. Studio exports include saved notes.</p>
    {storageError && <p role="alert" className="mt-2 rounded-sm border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">{storageError}</p>}
    <button type="button" aria-expanded={editorOpen} onClick={() => setEditorOpen((open) => !open)} className="mt-3 flex w-full items-center justify-between rounded-sm border border-[#E7E7E4] dark:border-[#26282E] px-3 py-2 text-left text-xs font-semibold text-[#222] dark:text-[#E5E7EB] hover:border-[#0284C7]"><span>{editorOpen ? "Close note editor" : "Add a study note"}</span><ChevronDown className={`h-4 w-4 transition-transform ${editorOpen ? "rotate-180" : ""}`}/></button>
    {editorOpen && <div className="mt-3 space-y-3">
    <div role="toolbar" aria-label="Note formatting" className="flex flex-wrap gap-1.5">{tools.map(({ label, icon: Icon, command, value }) => <button key={label} type="button" title={label} aria-label={label} onPointerDown={(event) => event.preventDefault()} onClick={() => formatSelection(command, value)} className="rounded border border-[#E7E7E4] dark:border-[#26282E] p-2 text-[#555555] dark:text-[#D1D5DB] hover:border-[#0284C7] hover:text-[#0369A1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><Icon className="h-4 w-4"/></button>)}</div>
    <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label="Write a research note" aria-multiline="true" data-placeholder="Record an observation, hypothesis, or follow-up question…" onInput={(event) => setText(event.currentTarget.innerText.trim())} className="orbital-note-editor min-h-32 w-full overflow-auto rounded-sm border border-[#E7E7E4] dark:border-[#26282E] bg-[#FAFAF8] dark:bg-[#161820] text-[#111111] dark:text-[#F3F4F6] p-3 text-sm leading-relaxed outline-none focus:border-[#0284C7] focus-visible:ring-2 focus-visible:ring-sky-500" />
    <div className="flex justify-end"><button type="button" disabled={!text.trim()} onClick={saveNote} className="inline-flex items-center gap-2 rounded-sm bg-[#111111] dark:bg-[#FFFFFF] px-3 py-2 text-xs font-semibold text-white dark:text-[#111111] hover:bg-[#303030] dark:hover:bg-[#E5E7EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-40"><Save className="h-3.5 w-3.5"/><span aria-live="polite">{saved ? "Saved" : "Save note"}</span></button></div>
    </div>}
    <div className="mt-2 border-t border-[#E7E7E4] pt-2">
      <button type="button" aria-expanded={savedOpen} onClick={() => setSavedOpen((open) => !open)} className="flex w-full items-center justify-between py-1 text-left text-xs font-semibold text-[#444] dark:text-[#E5E7EB] hover:text-[#0284C7]"><span>Saved notes ({notes.length})</span><ChevronDown className={`h-4 w-4 transition-transform ${savedOpen ? "rotate-180" : ""}`}/></button>
      {savedOpen && <div className="mt-2 space-y-2">
        <label className="flex items-center gap-2 rounded border border-[#E7E7E4] px-2.5"><Search className="h-3.5 w-3.5 shrink-0 text-[#8A8A83]"/><input aria-label="Search all saved notes" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all saved notes…" className="min-w-0 flex-1 py-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-sky-500"/></label>
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {visibleNotes.map((note) => <article key={note.id} className="flex justify-between gap-2 rounded-sm border border-[#E7E7E4] dark:border-[#26282E] bg-[#FAFAF8] dark:bg-[#161820] p-2.5"><div className="min-w-0"><span className="font-mono-sci text-[9px] uppercase text-[#0284C7]">{note.workspace}</span><div className="orbital-note-content mt-1 break-words text-xs leading-relaxed text-[#343434] dark:text-[#E5E7EB]" dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(note.html || legacyNoteHtml(note.text)) }} /><time className="mt-1 block font-mono-sci text-[9px] text-[#8A8A83] dark:text-[#9CA3AF]">{new Date(note.updated).toLocaleString()}</time></div><button type="button" aria-label="Delete note" onClick={() => persist(notes.filter((entry) => entry.id !== note.id))} className="h-fit rounded p-1.5 text-[#8A8A83] hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950/40"><Trash2 className="h-3.5 w-3.5"/></button></article>)}
          {visibleNotes.length === 0 && <p className="py-3 text-center text-xs text-[#8A8A83]">No matching notes.</p>}
        </div>
      </div>}
    </div>
  </section>;
}

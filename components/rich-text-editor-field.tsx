"use client";

import { useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Heading2, Heading3, Link2, List, ListOrdered, Quote, RemoveFormatting, Strikethrough, Underline as UnderlineIcon } from "lucide-react";

type RichTextEditorFieldProps = {
  name: string;
  label: string;
  placeholder: string;
  description?: string;
  rows?: number;
  required?: boolean;
  defaultValue?: string;
  className?: string;
};

function toInitialHtml(value: string) {
  if (!value.trim()) {
    return "";
  }
  if (/<\/?[a-z][\s\S]*>/i.test(value)) {
    return value;
  }
  return `<p>${value
    .split("\n")
    .map((line) => line.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] || ch)))
    .join("<br/>")}</p>`;
}

export function RichTextEditorField({
  name,
  label,
  placeholder,
  description,
  rows,
  required,
  defaultValue = "",
  className,
}: RichTextEditorFieldProps) {
  const initial = useMemo(() => toInitialHtml(defaultValue), [defaultValue]);
  const [value, setValue] = useState(initial);

  const editor = useEditor({
    immediatelyRender: false,
    content: initial,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    editorProps: {
      attributes: {
        class: "tiptap-editor rt-content",
      },
    },
    onUpdate({ editor: activeEditor }) {
      const plainText = activeEditor.getText().trim();
      setValue(plainText ? activeEditor.getHTML() : "");
    },
  });

  function toggleLink() {
    if (!editor) {
      return;
    }

    const current = editor.getAttributes("link").href as string | undefined;
    const next = window.prompt("https://", current || "https://");

    if (next === null) {
      return;
    }

    const trimmed = next.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: trimmed }).run();
  }

  return (
    <label className={`space-y-1 ${className || ""}`}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      <input type="hidden" name={name} value={value} required={required} />
      <div
        className="overflow-hidden rounded-lg border border-slate-300 bg-white"
        style={rows ? { ["--editor-min-height" as string]: `${Math.max(140, rows * 32)}px` } : undefined}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
          <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`editor-btn ${editor?.isActive("heading", { level: 2 }) ? "is-active" : ""}`} title="Heading 2"><Heading2 className="size-4" /></button>
          <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`editor-btn ${editor?.isActive("heading", { level: 3 }) ? "is-active" : ""}`} title="Heading 3"><Heading3 className="size-4" /></button>
          <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={`editor-btn ${editor?.isActive("bold") ? "is-active" : ""}`} title="Bold"><strong>B</strong></button>
          <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={`editor-btn ${editor?.isActive("italic") ? "is-active" : ""}`} title="Italic"><em>I</em></button>
          <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`editor-btn ${editor?.isActive("underline") ? "is-active" : ""}`} title="Underline"><UnderlineIcon className="size-4" /></button>
          <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} className={`editor-btn ${editor?.isActive("strike") ? "is-active" : ""}`} title="Strike"><Strikethrough className="size-4" /></button>
          <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`editor-btn ${editor?.isActive("bulletList") ? "is-active" : ""}`} title="Bullet list"><List className="size-4" /></button>
          <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`editor-btn ${editor?.isActive("orderedList") ? "is-active" : ""}`} title="Ordered list"><ListOrdered className="size-4" /></button>
          <button type="button" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={`editor-btn ${editor?.isActive("blockquote") ? "is-active" : ""}`} title="Quote"><Quote className="size-4" /></button>
          <button type="button" onClick={toggleLink} className={`editor-btn ${editor?.isActive("link") ? "is-active" : ""}`} title="Link"><Link2 className="size-4" /></button>
          <button type="button" onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()} className="editor-btn" title="Clear formatting"><RemoveFormatting className="size-4" /></button>
        </div>
        <EditorContent editor={editor} />
      </div>
    </label>
  );
}

"use client";

import { useRef, useState } from "react";

type AdminMediaUploaderProps = {
  createAction: (formData: FormData) => Promise<void>;
  isRo: boolean;
};

export function AdminMediaUploader({ createAction, isRo }: AdminMediaUploaderProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [sizeBytes, setSizeBytes] = useState("");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState("image");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function processFile(file?: File) {
    if (!file) return;
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data?.url) {
        setError(isRo ? "Upload esuat." : "Upload failed.");
        return;
      }
      setUrl(data.url);
      setMimeType(file.type || "");
      setSizeBytes(String(file.size || ""));
      setLabel(file.name || "");
      setKind((file.type || "").startsWith("image/") ? "image" : "file");
      setInfo(isRo ? "Upload reusit. Se salveaza in biblioteca..." : "Upload successful. Saving to library...");
      setTimeout(() => formRef.current?.requestSubmit(), 60);
    } catch {
      setError(isRo ? "Upload esuat." : "Upload failed.");
    } finally {
      setLoading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setDragOver(false);
    }
  }

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    await processFile(event.target.files?.[0]);
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-semibold">{isRo ? "Incarca media" : "Upload media"}</h2>
      <p className="mt-1 text-xs text-slate-600">
        {isRo ? "Incarca fisierul, apoi salveaza asset-ul in biblioteca." : "Upload a file, then save it into the media library."}
      </p>

      <div className="mt-3 space-y-3">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={async (event) => {
            event.preventDefault();
            await processFile(event.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center text-sm transition ${
            dragOver ? "border-slate-900 bg-slate-100 text-slate-900" : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          {isRo ? "Drag & drop fisier aici sau click pentru selectare" : "Drag & drop file here or click to select"}
        </div>
        <input ref={inputRef} type="file" onChange={onFileChange} className="hidden" />
        {loading ? <p className="text-xs text-slate-500">{isRo ? "Se incarca..." : "Uploading..."}</p> : null}
        {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      </div>

      {info ? <p className="mt-2 text-xs text-emerald-700">{info}</p> : null}

      <form ref={formRef} action={createAction} className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-medium text-slate-600">URL</span>
          <input
            name="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">{isRo ? "Eticheta" : "Label"}</span>
          <input
            name="label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Kind</span>
          <select
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="image">image</option>
            <option value="icon">icon</option>
            <option value="document">document</option>
            <option value="file">file</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">MIME</span>
          <input
            name="mimeType"
            value={mimeType}
            onChange={(event) => setMimeType(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">{isRo ? "Dimensiune (bytes)" : "Size (bytes)"}</span>
          <input
            name="sizeBytes"
            value={sizeBytes}
            onChange={(event) => setSizeBytes(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 md:col-span-2">
          {isRo ? "Salveaza manual in Media Library" : "Save manually to media library"}
        </button>
      </form>
    </section>
  );
}

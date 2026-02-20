import type { Metadata } from "next";
import Image from "next/image";
import { AdminMediaUploader } from "@/components/admin-media-uploader";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { createMediaAsset, deleteMediaAsset } from "@/lib/admin-actions";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Media Library" };

export default async function AdminMediaPage() {
  const locale = await getLocale();
  const isRo = locale === "ro";
  const media = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{isRo ? "Media Library" : "Media Library"}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isRo ? "Gestioneaza imagini/fisiere folosite in site (favicon, OG, logo, assets)." : "Manage images/files used in site (favicon, OG, logo, assets)."}
        </p>
      </div>

      <AdminMediaUploader createAction={createMediaAsset} isRo={isRo} />

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">{isRo ? "Assets existente" : "Existing assets"}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {media.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                {item.kind === "image" || item.kind === "icon" ? (
                  <Image src={item.url} alt={item.label || item.url} width={400} height={220} className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center text-xs text-slate-500">{item.mimeType || item.kind}</div>
                )}
              </div>
              <p className="truncate text-sm font-semibold text-slate-900">{item.label || item.url}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{item.url}</p>
              <p className="mt-1 text-xs text-slate-500">{item.kind}{item.mimeType ? ` - ${item.mimeType}` : ""}</p>
              <div className="mt-3 flex items-center gap-2">
                <a href={item.url} target="_blank" rel="noreferrer" className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-100">
                  {isRo ? "Deschide" : "Open"}
                </a>
                <form action={deleteMediaAsset}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmSubmitButton
                    confirmMessage={isRo ? "Sigur vrei sa stergi asset-ul media?" : "Are you sure you want to delete this media asset?"}
                    secureDelete
                    deleteKeywordPrompt={isRo ? "Scrie DELETE pentru confirmare:" : "Type DELETE to confirm:"}
                    passwordPrompt={isRo ? "Confirma parola ta de admin:" : "Confirm your admin password:"}
                    className="rounded-md border border-rose-300 px-2.5 py-1 text-xs text-rose-700 hover:bg-rose-50"
                  >
                    {isRo ? "Sterge" : "Delete"}
                  </ConfirmSubmitButton>
                </form>
              </div>
            </article>
          ))}
          {media.length === 0 ? <p className="text-sm text-slate-600">{isRo ? "Nu exista asset-uri." : "No assets yet."}</p> : null}
        </div>
      </section>
    </div>
  );
}



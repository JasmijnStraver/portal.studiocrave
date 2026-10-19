import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import LogoutButton from "@/components/portal/LogoutButton";

export default async function KeukenLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin();
  // Getekende documenten die je nog niet zelf hebt opgeslagen
  const { count: nietOpgeslagen } = await supabase
    .from("document_archief")
    .select("document_id", { count: "exact", head: true })
    .is("studio_download_op", null);

  return (
    <div className="admin grid md:grid-cols-[260px_1fr] min-h-screen">
      <aside className="bg-side text-creme p-6 flex flex-col gap-6">
        <Link href="/keuken" className="flex items-center gap-2">
          <Image src="/brand/sc-monogram-wit.png" alt="" width={28} height={28} />
          <span className="wordmark text-xl">Studio Crave</span>
        </Link>
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/keuken" className="px-3 py-2 rounded hover:bg-creme/10">
            Overzicht
          </Link>
          <Link href="/keuken/nieuw" className="px-3 py-2 rounded hover:bg-creme/10">
            Nieuwe klant
          </Link>
          <Link href="/keuken/skills" className="px-3 py-2 rounded hover:bg-creme/10">
            Skills beheer
          </Link>
          <Link href="/keuken/documenten" className="px-3 py-2 rounded hover:bg-creme/10">
            Documenten
          </Link>
          <Link href="/keuken/archief" className="px-3 py-2 rounded hover:bg-creme/10 flex items-center justify-between">
            Archief
            {!!nietOpgeslagen && (
              <span className="text-[0.7rem] rounded-full bg-gold text-midnight px-2 py-0.5" title="Nog niet zelf opgeslagen">
                {nietOpgeslagen}
              </span>
            )}
          </Link>
        </nav>
        <div className="mt-auto">
          <LogoutButton className="text-creme/60 hover:text-creme text-sm" />
        </div>
      </aside>
      <main className="p-6 md:p-10">{children}</main>
    </div>
  );
}

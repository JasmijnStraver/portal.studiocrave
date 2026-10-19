import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/auth";
import LogoutButton from "@/components/portal/LogoutButton";

export default async function KeukenLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

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
        </nav>
        <div className="mt-auto">
          <LogoutButton className="text-creme/60 hover:text-creme text-sm" />
        </div>
      </aside>
      <main className="p-6 md:p-10">{children}</main>
    </div>
  );
}

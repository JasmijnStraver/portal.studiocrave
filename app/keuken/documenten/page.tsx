import { requireAdmin } from "@/lib/auth";
import DocumentSjablonen from "@/components/keuken/DocumentSjablonen";

export default async function KeukenDocumentenPage() {
  const { supabase } = await requireAdmin();
  const [{ data: sjablonen }, { data: instellingen }] = await Promise.all([
    supabase.from("document_templates").select("*").order("volgorde"),
    supabase.from("portal_settings").select("handtekening_path, ondertekenaar, bedrijfsgegevens").eq("id", 1).single(),
  ]);
  return (
    <DocumentSjablonen
      sjablonen={sjablonen ?? []}
      instellingen={{
        handtekening_path: instellingen?.handtekening_path ?? null,
        ondertekenaar: instellingen?.ondertekenaar ?? "Jasmijn Straver",
        bedrijfsgegevens: instellingen?.bedrijfsgegevens ?? "Studio Crave · info@studiocrave.nl",
      }}
    />
  );
}

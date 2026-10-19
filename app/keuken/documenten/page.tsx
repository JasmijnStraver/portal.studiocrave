import { requireAdmin } from "@/lib/auth";
import DocumentSjablonen from "@/components/keuken/DocumentSjablonen";
import type { DocumentVelden } from "@/lib/content/documenten";

export default async function KeukenDocumentenPage() {
  const { supabase } = await requireAdmin();
  const [{ data: sjablonen }, { data: inst }] = await Promise.all([
    supabase.from("document_templates").select("*").order("volgorde"),
    supabase.from("portal_settings").select("handtekening_path, ondertekenaar, document_velden").eq("id", 1).single(),
  ]);
  const handtekeningUrl = inst?.handtekening_path
    ? (await supabase.storage.from("klanten").createSignedUrl(inst.handtekening_path, 3600)).data?.signedUrl ?? null
    : null;
  return (
    <DocumentSjablonen
      sjablonen={sjablonen ?? []}
      ondertekenaar={inst?.ondertekenaar ?? "Jasmijn Straver"}
      handtekeningUrl={handtekeningUrl}
      velden={(inst?.document_velden as unknown as DocumentVelden) ?? { studio: {}, pakketten: {}, extras: {} }}
    />
  );
}

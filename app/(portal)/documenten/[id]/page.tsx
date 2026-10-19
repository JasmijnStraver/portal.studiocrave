import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import DocumentView from "@/components/portal/DocumentView";

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const { supabase, client } = await requireClient();
  const { data: doc } = await supabase.from("documents").select("*").eq("id", params.id).eq("client_id", client.id).maybeSingle();
  if (!doc) notFound();

  const { data: inst } = await supabase.from("portal_settings").select("ondertekenaar, handtekening_path").eq("id", 1).single();
  // Tijdelijke links naar de handtekeningen (privé opslag)
  const link = async (pad: string | null | undefined) =>
    pad ? (await supabase.storage.from("klanten").createSignedUrl(pad, 3600)).data?.signedUrl ?? null : null;
  const [studioHandtekening, eigenHandtekening] = await Promise.all([
    doc.tekenen ? link(inst?.handtekening_path) : null,
    link(doc.handtekening_path),
  ]);

  return (
    <DocumentView
      doc={doc}
      naam={client.naam}
      bedrijf={client.bedrijf}
      ondertekenaar={inst?.ondertekenaar ?? "Jasmijn Straver"}
      studioHandtekening={studioHandtekening}
      eigenHandtekening={eigenHandtekening}
    />
  );
}

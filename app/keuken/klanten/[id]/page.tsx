import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import ClientDetail from "@/components/keuken/ClientDetail";

export default async function KlantDetailPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin();
  const [{ data: client }, { data: courses }, { data: documents }, { data: activiteit }, { data: skills }, { data: allSkills }, { data: sjablonen }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", params.id).single(),
    supabase.from("client_courses").select("*").eq("client_id", params.id).order("volgorde"),
    supabase.from("documents").select("*").eq("client_id", params.id).order("volgorde").order("created_at"),
    supabase.from("activity").select("*").eq("client_id", params.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("skills").select("id, naam, course").eq("status", "live"),
    supabase.from("skills").select("id, naam, course"),
    supabase.from("document_templates").select("id, titel").order("volgorde"),
  ]);

  if (!client) notFound();

  return (
    <ClientDetail
      client={client}
      courses={courses ?? []}
      documents={documents ?? []}
      activiteit={activiteit ?? []}
      liveSkills={skills ?? []}
      allSkills={allSkills ?? []}
      sjablonen={sjablonen ?? []}
    />
  );
}

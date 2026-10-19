import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth";
import DocumentView from "@/components/portal/DocumentView";

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const { supabase, client } = await requireClient();
  const { data: doc } = await supabase.from("documents").select("*").eq("id", params.id).eq("client_id", client.id).maybeSingle();
  if (!doc) notFound();
  return <DocumentView doc={doc} naam={client.naam} />;
}

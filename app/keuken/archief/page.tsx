import { requireAdmin } from "@/lib/auth";
import Archief from "@/components/keuken/Archief";

export default async function ArchiefPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("document_archief").select("*").order("getekend_op", { ascending: false });
  return <Archief rijen={data ?? []} />;
}

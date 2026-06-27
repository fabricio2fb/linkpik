import { redirect } from "next/navigation";
import { FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";

export default async function NovoProdutoLegadoPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const params = await searchParams;
  const tipo = String(params.tipo ?? "").toLowerCase();
  if (tipo === "fisico" || tipo === "físico" || tipo === "physical") {
    if (!FEATURE_PHYSICAL_PRODUCT) redirect("/dashboard/infoprodutos/produtos/novo");
    redirect("/dashboard/fisicos/produtos/novo");
  }
  redirect("/dashboard/infoprodutos/produtos/novo");
}

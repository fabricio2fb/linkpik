import ProductEditPage from "@/components/dashboard/ProductEditPage";

export default async function EditarProdutoFisicoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ProductEditPage
      productId={id}
      title="Editar produto fisico"
      description="Atualize estoque, medidas, frete e informacoes do produto."
      productKind="physical"
      backHref="/dashboard/fisicos/produtos"
    />
  );
}

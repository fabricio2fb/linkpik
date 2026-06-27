import ProductEditPage from "@/components/dashboard/ProductEditPage";

export default async function EditarInfoprodutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ProductEditPage
      productId={id}
      title="Editar infoproduto"
      description="Atualize os dados do produto digital e da entrega automatica."
      productKind="digital"
      backHref="/dashboard/infoprodutos/produtos"
    />
  );
}

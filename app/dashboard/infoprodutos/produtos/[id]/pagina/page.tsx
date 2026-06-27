import ProductPageBuilder from "@/components/dashboard/ProductPageBuilder";

export default async function ProdutoPaginaBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductPageBuilder productId={id} />;
}


import ProductCreatePage from "@/components/dashboard/ProductCreatePage";

export default function NovoProdutoFisicoPage() {
  return (
    <ProductCreatePage
      title="Novo produto fisico"
      description="Cadastre um produto com estoque, medidas, frete e envio."
      productKind="physical"
      backHref="/dashboard/fisicos/produtos"
      successMessage="Produto fisico criado"
    />
  );
}

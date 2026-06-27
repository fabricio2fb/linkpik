import ProductCreatePage from "@/components/dashboard/ProductCreatePage";

export default function NovoInfoprodutoPage() {
  return (
    <ProductCreatePage
      title="Novo infoproduto"
      description="Cadastre um produto digital com entrega automatica."
      productKind="digital"
      backHref="/dashboard/infoprodutos/produtos"
      successMessage="Infoproduto criado"
    />
  );
}

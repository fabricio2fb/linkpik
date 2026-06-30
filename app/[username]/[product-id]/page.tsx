import { notFound } from "next/navigation";
import ProductPageComponent from "@/components/store/ProductPage";
import StoreTrackingScripts from "@/components/store/StoreTrackingScripts";
import { FEATURE_PHYSICAL_PRODUCT } from "@/lib/feature-flags";
import { mapApiCreator, mapApiProduct } from "@/lib/api-mappers";
import { getPublicStore } from "@/lib/public-store";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

type PublicProductPageProps = {
  params: Promise<{ username: string; "product-id": string }>;
};

export default async function PublicProductPage({ params }: PublicProductPageProps) {
  const { username, "product-id": productId } = await params;
  const store = await getPublicStore(username);

  if (!store) notFound();

  if ((store.creator as Record<string, unknown>)?.suspended) {
    return <LojaSuspensa />;
  }

  const creator = mapApiCreator(store.creator, store.links);
  const products: Product[] = store.products.map(mapApiProduct);
  const product = products.find((item) => item.id === productId);
  if (!product) notFound();
  if (!FEATURE_PHYSICAL_PRODUCT && product.type === "fisico") notFound();
  const otherProducts = products.filter((item) => item.id !== product.id && (FEATURE_PHYSICAL_PRODUCT || item.type !== "fisico"));

  return (
    <>
      <StoreTrackingScripts settings={store.settings} />
      <ProductPageComponent
        creator={creator}
        product={product}
        otherProducts={otherProducts}
        theme={creator.theme}
      />
    </>
  );
}

function LojaSuspensa() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-red-100">
          <span className="text-3xl">&#128274;</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Loja indisponivel</h1>
        <p className="text-gray-600">
          Esta loja esta temporariamente indisponivel. Entre em contato com o criador por outro canal.
        </p>
      </div>
    </div>
  );
}


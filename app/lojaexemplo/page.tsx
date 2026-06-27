import StorePage from "@/components/store/StorePage";
import { landingCreator, landingProducts } from "@/components/landing/landing-content";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ExampleStorePage() {
  const creator = { ...landingCreator, username: "lojaexemplo" };

  return (
    <StorePage
      creator={creator}
      products={landingProducts}
      theme={creator.theme}
    />
  );
}

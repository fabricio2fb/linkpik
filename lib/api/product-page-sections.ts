import { sanitizeHtml } from "@/lib/api/sanitize";
import { countBuyButtons, productRequiresBuyButton, ProductPageSectionsSchema, type ProductPageSection } from "@/lib/product-page-sections";
import { ApiError } from "@/lib/api/errors";
import type { Product } from "@/lib/types";

export function sanitizeProductPageSections(sections: ProductPageSection[]): ProductPageSection[] {
  return sections.map((section) => {
    switch (section.type) {
      case "paragraph":
        return { ...section, data: { content: sanitizeHtml(section.data.content) } };
      case "quote":
        return { ...section, data: { text: sanitizeHtml(section.data.text) } };
      case "faq":
        return { ...section, data: { items: section.data.items.map((item) => ({ ...item, answer: sanitizeHtml(item.answer) })) } };
      case "image_text":
        return { ...section, data: { ...section.data, text: sanitizeHtml(section.data.text) } };
      case "testimonials":
        return { ...section, data: { items: section.data.items.map((item) => ({ ...item, text: sanitizeHtml(item.text) })) } };
      default:
        return section;
    }
  });
}

export function parseAndValidateProductPageSections(value: unknown, product: Pick<Product, "price" | "billingType">): ProductPageSection[] {
  const parsed = ProductPageSectionsSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new ApiError(400, issue?.path.length ? `Dados invalidos: page_sections.${issue.path.join(".")}` : "Dados invalidos: page_sections");
  }

  const buyButtonCount = countBuyButtons(parsed.data);
  if (buyButtonCount > 5) throw new ApiError(400, "A pagina pode ter no maximo 5 botoes de compra.");
  if (productRequiresBuyButton(product) && buyButtonCount < 1) {
    throw new ApiError(400, "Produto pago precisa ter pelo menos 1 botao de compra.");
  }

  return sanitizeProductPageSections(parsed.data);
}


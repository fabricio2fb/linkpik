import {
  BookOpen,
  GraduationCap,
  Layout,
  Package,
  PackageCheck,
  Table2,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { ProductType } from "./types";

export const PRODUCT_TYPES = {
  infoproduto: {
    label: "Infoproduto",
    icon: "PackageCheck",
    Icon: PackageCheck,
    color: "#FF4D6D",
    gradient: ["#4a1020", "#991b35"],
    description: "Produto digital entregue pela internet",
    example: "curso, arquivo, comunidade, mentoria ou material digital",
  },
  fisico: {
    label: "Produto fisico",
    icon: "Package",
    Icon: Package,
    color: "#22C55E",
    gradient: ["#052e16", "#166534"],
    description: "Produto com envio ou entrega manual",
    example: "camiseta, livro impresso, cosmetico, acessorio",
  },
  ebook: {
    label: "Infoproduto",
    icon: "BookOpen",
    Icon: BookOpen,
    color: "#FF4D6D",
    gradient: ["#4a1020", "#991b35"],
    description: "Produto digital entregue pela internet",
    example: "curso, arquivo, comunidade, mentoria ou material digital",
  },
  planilha: {
    label: "Infoproduto",
    icon: "Table2",
    Icon: Table2,
    color: "#FF4D6D",
    gradient: ["#4a1020", "#991b35"],
    description: "Produto digital entregue pela internet",
    example: "curso, arquivo, comunidade, mentoria ou material digital",
  },
  template: {
    label: "Infoproduto",
    icon: "Layout",
    Icon: Layout,
    color: "#FF4D6D",
    gradient: ["#4a1020", "#991b35"],
    description: "Produto digital entregue pela internet",
    example: "curso, arquivo, comunidade, mentoria ou material digital",
  },
  curso: {
    label: "Infoproduto",
    icon: "GraduationCap",
    Icon: GraduationCap,
    color: "#FF4D6D",
    gradient: ["#4a1020", "#991b35"],
    description: "Produto digital entregue pela internet",
    example: "curso, arquivo, comunidade, mentoria ou material digital",
  },
  mentoria: {
    label: "Infoproduto",
    icon: "Video",
    Icon: Video,
    color: "#FF4D6D",
    gradient: ["#4a1020", "#991b35"],
    description: "Produto digital entregue pela internet",
    example: "curso, arquivo, comunidade, mentoria ou material digital",
  },
  pack: {
    label: "Infoproduto",
    icon: "Package",
    Icon: Package,
    color: "#FF4D6D",
    gradient: ["#4a1020", "#991b35"],
    description: "Produto digital entregue pela internet",
    example: "curso, arquivo, comunidade, mentoria ou material digital",
  },
  comunidade: {
    label: "Infoproduto",
    icon: "Users",
    Icon: Users,
    color: "#FF4D6D",
    gradient: ["#4a1020", "#991b35"],
    description: "Produto digital entregue pela internet",
    example: "curso, arquivo, comunidade, mentoria ou material digital",
  },
} satisfies Record<
  ProductType,
  {
    label: string;
    icon: string;
    Icon: LucideIcon;
    color: string;
    gradient: [string, string];
    description: string;
    example: string;
  }
>;

export const PRODUCT_TYPE_IDS: ProductType[] = ["infoproduto", "fisico"];

export const PRODUCT_GRADIENTS: Record<ProductType, [string, string][]> = {
  infoproduto: [["#4a1020", "#991b35"], ["#FF4D6D", "#7C3AED"], ["#831843", "#F472B6"], ["#0f172a", "#FF4D6D"]],
  fisico: [["#052e16", "#166534"], ["#22C55E", "#84CC16"], ["#134e4a", "#14B8A6"], ["#0f172a", "#22C55E"]],
  ebook: [["#4a1020", "#991b35"], ["#FF4D6D", "#7C3AED"], ["#831843", "#F472B6"], ["#0f172a", "#FF4D6D"]],
  planilha: [["#4a1020", "#991b35"], ["#FF4D6D", "#7C3AED"], ["#831843", "#F472B6"], ["#0f172a", "#FF4D6D"]],
  template: [["#4a1020", "#991b35"], ["#FF4D6D", "#7C3AED"], ["#831843", "#F472B6"], ["#0f172a", "#FF4D6D"]],
  curso: [["#4a1020", "#991b35"], ["#FF4D6D", "#7C3AED"], ["#831843", "#F472B6"], ["#0f172a", "#FF4D6D"]],
  mentoria: [["#4a1020", "#991b35"], ["#FF4D6D", "#7C3AED"], ["#831843", "#F472B6"], ["#0f172a", "#FF4D6D"]],
  pack: [["#4a1020", "#991b35"], ["#FF4D6D", "#7C3AED"], ["#831843", "#F472B6"], ["#0f172a", "#FF4D6D"]],
  comunidade: [["#4a1020", "#991b35"], ["#FF4D6D", "#7C3AED"], ["#831843", "#F472B6"], ["#0f172a", "#FF4D6D"]],
};

export function getProductTypeMeta(type: ProductType) {
  return PRODUCT_TYPES[type];
}

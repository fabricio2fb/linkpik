import { redirect } from "next/navigation";

export default function LegacyPhysicalSalesPage() {
  redirect("/dashboard/fisicos/pedidos");
}

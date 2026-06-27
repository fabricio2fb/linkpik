import { redirect } from "next/navigation";

export default function LegacyTrackingPage() {
  redirect("/dashboard/fisicos/entregas");
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/guard";
import { getAdminSession } from "@/lib/admin/session";
import BlogForm from "../_components/BlogForm";

export const metadata: Metadata = {
  title: "Novo post — Admin Pikbio",
};

export default async function NewPostPage() {
  const adminUser = await requireAdminUser();
  if (!adminUser) notFound();
  const adminSession = await getAdminSession();
  if (!adminSession) notFound();

  return <BlogForm />;
}

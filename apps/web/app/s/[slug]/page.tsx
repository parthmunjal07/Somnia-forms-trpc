import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicFormRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/f/${slug}`);
}

import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { PolicyService } from "@/lib/services/policy.service";
import { PolicyDetailClient } from "./policy-detail-client";

interface PolicyPageProps {
  params: Promise<{ id: string }>;
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const { id } = await params;
  const policy = await PolicyService.findById(id, session.user.id);

  if (!policy) {
    notFound();
  }

  // Serialize Decimal/Date fields to plain JSON for the client component
  const serialized = JSON.parse(JSON.stringify(policy));

  return (
    <div className="mx-auto max-w-5xl">
      <PolicyDetailClient policy={serialized} />
    </div>
  );
}

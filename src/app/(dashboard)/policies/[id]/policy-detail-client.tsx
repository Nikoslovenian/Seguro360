"use client";

import { useRouter } from "next/navigation";
import { PolicyDetail } from "@/components/policies/policy-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface PolicyDetailClientProps {
  policy: Parameters<typeof PolicyDetail>[0]["policy"];
}

export function PolicyDetailClient({ policy }: PolicyDetailClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/policies")}
        className="gap-1"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a polizas
      </Button>
      <PolicyDetail policy={policy} />
    </div>
  );
}

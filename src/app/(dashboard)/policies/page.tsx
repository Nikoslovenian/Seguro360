import { Suspense } from "react";
import { PolicyList } from "@/components/policies/policy-list";

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Polizas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestione y consulte todas sus polizas de seguro extraidas
          automaticamente.
        </p>
      </div>

      <Suspense fallback={null}>
        <PolicyList />
      </Suspense>
    </div>
  );
}

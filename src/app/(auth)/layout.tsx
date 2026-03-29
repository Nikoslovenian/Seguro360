export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            CS
          </div>
          <span className="text-2xl font-bold text-gray-900">CoverSight</span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Gestion inteligente de seguros
        </p>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f1117] px-4 py-12">
      {/* Background glow */}
      <div className="fixed top-20 left-1/3 h-72 w-72 rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
      <div className="fixed bottom-20 right-1/3 h-72 w-72 rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />

      <div className="relative mb-8 flex flex-col items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20">
            360
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Seguro 360
          </span>
        </div>
        <p className="mt-2 text-sm text-[#94a3b8]">
          Gestion inteligente de seguros
        </p>
      </div>
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}

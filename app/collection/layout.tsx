export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
    return     (<div className="space-y-6">
          <header className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-5xl font-bold text-slate-900 tracking-tight font-voya-nui">
                Collection
              </h1>
            </div>
          </header>{children}
    </div>);
}
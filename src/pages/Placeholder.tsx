export function Placeholder({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="p-6 max-w-xl mx-auto text-center" style={{ paddingTop: '4rem' }}>
      <div className="text-5xl mb-4">{icon}</div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-sm" style={{ color: 'var(--t3)' }}>
        This module is being migrated to the React platform. Coming soon.
      </p>
    </div>
  )
}

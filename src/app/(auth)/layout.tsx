export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(0,156,59,0.22) 0%, transparent 65%), radial-gradient(ellipse 55% 40% at 100% 100%, rgba(245,200,0,0.18) 0%, transparent 60%), #1a2218',
    }}>
      {children}
    </div>
  )
}

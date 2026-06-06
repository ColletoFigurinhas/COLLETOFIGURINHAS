export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(29,78,216,0.25) 0%, transparent 65%), radial-gradient(ellipse 55% 40% at 100% 100%, rgba(59,130,246,0.12) 0%, transparent 60%), #070e1a',
    }}>
      {children}
    </div>
  )
}

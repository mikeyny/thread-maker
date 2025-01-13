import './globals.css'
import { Sidebar } from '@/components/ui/Sidebar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <div className="pl-72 min-h-screen bg-white">
          {children}
        </div>
      </body>
    </html>
  )
}

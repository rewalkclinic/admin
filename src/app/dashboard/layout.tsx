import { DashboardNavbar } from "@/components/dashboard/navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <main className="container mx-auto space-y-4">
        {children}
      </main>
    </div>
  )
}

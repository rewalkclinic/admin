"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { dashboardBoxes } from "@/config/dashboard"
import { ChevronLeft, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

const invoiceNavItems = dashboardBoxes.find(box => box.id === "invoices")?.dialogContent || []

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const Sidebar = () => (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <Link href="/dashboard">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      <div className="px-3">
        {invoiceNavItems.map((item) => (
          <Link
            key={item.link}
            href={item.link}
          >
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 my-1",
                pathname === item.link && "bg-accent"
              )}
            >
              <item.icon className={cn("h-4 w-4", item.iconColor)} />
              {item.title}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )

  return (
    <div className="grid lg:grid-cols-[256px_1fr] h-[calc(100vh-4rem-3rem)]">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden absolute left-4">
          <Button variant="outline" size="icon">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[256px] p-0 lg:hidden">
          <Sidebar />
        </SheetContent>
      </Sheet>
      <div className="hidden lg:block border-r">
        <Sidebar />
      </div>
      <div className="p-6 overflow-auto">{children}</div>
    </div>
  )
}

import { dashboardBoxes } from "@/config/dashboard"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="space-y-4 p-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to the Rewalk Clinic admin dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboardBoxes.map((box) => (
          box.dialogContent ? (
            <Dialog key={box.id}>
              <DialogTrigger asChild>
                <Card className="p-6 hover:bg-accent cursor-pointer transition-colors">
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-lg ${box.iconBg} flex items-center justify-center`}>
                      <box.icon className={`w-6 h-6 ${box.iconColor}`} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{box.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {box.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{box.title}</DialogTitle>
                  <DialogDescription>Select an action below</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  {box.dialogContent.map((item) => (
                    <Link href={item.link} key={item.link}>
                      <Card className={`p-4 hover:bg-accent cursor-pointer transition-colors border-l-4 ${item.borderColor}`}>
                        <div className="flex items-start space-x-4">
                          <div className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <item.icon className={`w-5 h-5 ${item.iconColor}`} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Link href={box.link || '#'} key={box.id}>
              <Card className="p-6 hover:bg-accent cursor-pointer transition-colors">
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-lg ${box.iconBg} flex items-center justify-center`}>
                    <box.icon className={`w-6 h-6 ${box.iconColor}`} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{box.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {box.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        ))}
      </div>
    </div>
  )
}
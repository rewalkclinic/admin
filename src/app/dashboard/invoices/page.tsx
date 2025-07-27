"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Eye, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DownloadInvoiceButton } from "@/components/dashboard/download-invoice-button"

interface Invoice {
  id: string
  invoiceNo: string
  patientName: string
  total: number
  status: "PENDING" | "PAID" | "CANCELLED"
  createdAt: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => {
        setInvoices(data)
        setLoading(false)
      })
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">Manage patient invoices</p>
        </div>
        <Link href="/dashboard/invoices/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                  <TableCell>{invoice.patientName}</TableCell>
                  <TableCell>₹{invoice.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <DownloadInvoiceButton invoiceId={invoice.id} />
                    <Link href={`/dashboard/invoices/${invoice.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Edit } from "lucide-react"
import { DownloadInvoiceButton } from "@/components/dashboard/download-invoice-button"

interface InvoiceItem {
  name: string
  unitPrice: number
  hsnCode: string
  quantity: number
  total: number
  taxRate: number
  cgst: number
  sgst: number
  igst: number
  totalWithTax: number
}

interface Invoice {
  id: string
  invoiceNo: string
  patientName: string
  email: string | null
  phone: string | null
  isGstRegistered: boolean
  companyName: string | null
  gstin: string | null
  addressLine1: string | null
  city: string | null
  state: string | null
  pincode: string | null
  items: InvoiceItem[]
  subtotal: number
  cgst: number
  sgst: number
  igst: number
  total: number
  status: "PENDING" | "PAID" | "CANCELLED"
  createdAt: string
}

export default function InvoiceDetailsPage() {
  const params = useParams()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/invoices/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setInvoice(data)
        setLoading(false)
      })
  }, [params.id])

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

  if (loading) {
    return <div className="text-center">Loading...</div>
  }

  if (!invoice) {
    return <div className="text-center">Invoice not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoices">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Invoice {invoice.invoiceNo}</h2>
            <p className="text-muted-foreground">View invoice details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <DownloadInvoiceButton invoiceId={invoice.id} variant="outline" />
          <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Invoice Details</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant="secondary" className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Date Created</dt>
              <dd>{new Date(invoice.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </Card>        <Card className="p-6">
          <h3 className="font-semibold mb-4">Patient Details</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{invoice.patientName}</dd>
            </div>
            {invoice.email && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{invoice.email}</dd>
              </div>
            )}
            {invoice.phone && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{invoice.phone}</dd>
              </div>
            )}
            {invoice.isGstRegistered && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Company Name</dt>
                  <dd>{invoice.companyName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">GSTIN</dt>
                  <dd>{invoice.gstin}</dd>
                </div>
              </>
            )}
            {invoice.addressLine1 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Address</dt>
                <dd className="text-right">
                  <p>{invoice.addressLine1}</p>
                  <p>{invoice.city}</p>
                  <p>{invoice.state} - {invoice.pincode}</p>
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Items</h3>        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead className="text-right">HSN</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              {invoice.state === "West Bengal" ? (
                <>
                  <TableHead className="text-right">CGST</TableHead>
                  <TableHead className="text-right">SGST</TableHead>
                </>
              ) : (
                <TableHead className="text-right">IGST</TableHead>
              )}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-right">{item.hsnCode}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">₹{item.unitPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{item.total.toFixed(2)}</TableCell>
                {invoice.state === "West Bengal" ? (
                  <>
                    <TableCell className="text-right">
                      {(item.taxRate/2).toFixed(1)}% (₹{item.cgst.toFixed(2)})
                    </TableCell>
                    <TableCell className="text-right">
                      {(item.taxRate/2).toFixed(1)}% (₹{item.sgst.toFixed(2)})
                    </TableCell>
                  </>
                ) : (
                  <TableCell className="text-right">
                    {item.taxRate}% (₹{item.igst.toFixed(2)})
                  </TableCell>
                )}
                <TableCell className="text-right">₹{item.totalWithTax.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={invoice.state === "West Bengal" ? 7 : 6} className="text-right font-medium">
                Subtotal
              </TableCell>
              <TableCell className="text-right">₹{invoice.subtotal.toFixed(2)}</TableCell>
            </TableRow>
            {invoice.state === "West Bengal" ? (
              <>
                <TableRow>
                  <TableCell colSpan={7} className="text-right font-medium">
                    CGST
                  </TableCell>
                  <TableCell className="text-right">₹{invoice.cgst.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={7} className="text-right font-medium">
                    SGST
                  </TableCell>
                  <TableCell className="text-right">₹{invoice.sgst.toFixed(2)}</TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-right font-medium">
                  IGST
                </TableCell>
                <TableCell className="text-right">₹{invoice.igst.toFixed(2)}</TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell colSpan={invoice.state === "West Bengal" ? 7 : 6} className="text-right font-bold">
                Total
              </TableCell>
              <TableCell className="text-right font-bold">
                ₹{invoice.total.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

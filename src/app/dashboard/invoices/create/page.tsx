"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Plus, Trash } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import states from "@/data/states.json"
import hsnCodes from "@/data/hsn-codes.json"

interface Item {
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

interface FormData {
  patientName: string
  email: string
  phone: string
  companyName: string
  gstin: string
  addressLine1: string
  city: string
  state: string
  pincode: string
  type: "INDIVIDUAL" | "BUSINESS"
  status: "PENDING" | "PAID"
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  // const [isGstRegistered, setIsGstRegistered] = useState(false);
  const [items, setItems] = useState<Item[]>([
    { 
      name: "", 
      unitPrice: 0, 
      hsnCode: "", 
      quantity: 1, 
      total: 0, 
      taxRate: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalWithTax: 0
    },
  ])
  const [formData, setFormData] = useState<FormData>({
    patientName: "",
    email: "",
    phone: "",
    companyName: "",
    gstin: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    type: "INDIVIDUAL",
    status: "PENDING"
  })

  const [subtotal, setSubtotal] = useState(0)
  const [cgst, setCgst] = useState(0)
  const [sgst, setSgst] = useState(0)
  const [igst, setIgst] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    calculateTotals()
  }, [items, formData.state])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  const handleStateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, state: value }))
    // Recalculate taxes for all items when state changes
    const updatedItems = items.map(item => calculateItemTaxes({ ...item }, value))
    setItems(updatedItems)
  }
  const calculateItemTaxes = (item: Item, state: string) => {
    const total = Number(item.unitPrice) * Number(item.quantity);
    const taxAmount = (total * item.taxRate) / 100;
    
    if (state === "West Bengal") {
      item.cgst = taxAmount / 2;
      item.sgst = taxAmount / 2;
      item.igst = 0;
    } else {
      item.cgst = 0;
      item.sgst = 0;
      item.igst = taxAmount;
    }
    
    item.total = total;
    item.totalWithTax = total + taxAmount;
    return item;
  };

  const handleItemChange = (
    index: number,
    field: keyof Item,
    value: string | number
  ) => {
    const newItems = [...items]
    const item = { ...newItems[index], [field]: value }

    if (field === "hsnCode") {
      const hsnData = hsnCodes.hsnCodes.find((h) => h.code === value)
      item.taxRate = hsnData?.taxRate || 0
    }

    if (field === "unitPrice" || field === "quantity" || field === "hsnCode") {
      item.total = Number(item.unitPrice) * Number(item.quantity)
      const updatedItem = calculateItemTaxes(item, formData.state)
      newItems[index] = updatedItem
    } else {
      newItems[index] = item
    }

    setItems(newItems)
  }

  const addItem = () => {
    setItems([
      ...items,
      { 
        name: "", 
        unitPrice: 0, 
        hsnCode: "", 
        quantity: 1, 
        total: 0, 
        taxRate: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalWithTax: 0
      },
    ])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index)
      setItems(newItems)
    }
  }
  const calculateTotals = () => {
    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0)
    setSubtotal(newSubtotal)

    const totalCgst = items.reduce((sum, item) => sum + item.cgst, 0)
    const totalSgst = items.reduce((sum, item) => sum + item.sgst, 0)
    const totalIgst = items.reduce((sum, item) => sum + item.igst, 0)

    setCgst(totalCgst)
    setSgst(totalSgst)
    setIgst(totalIgst)

    setTotal(items.reduce((sum, item) => sum + item.totalWithTax, 0))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,

          items,
          subtotal,
          cgst,
          sgst,
          igst,
          total,
        }),
      })

      if (!response.ok) throw new Error("Failed to create invoice")

      router.push("/dashboard/invoices")
      router.refresh()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleTypeChange = (value: "INDIVIDUAL" | "BUSINESS") => {
    setFormData(prev => ({
      ...prev,
      type: value,
      isGstRegistered: value === "BUSINESS"
    }))
  }

  const handleStatusChange = (value: "PENDING" | "PAID") => {
    setFormData(prev => ({
      ...prev,
      status: value
    }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/invoices">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create Invoice</h2>
          <p className="text-muted-foreground">
            Create a new invoice for a patient
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Invoice Type</Label>
              <Select value={formData.type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {formData.type === "INDIVIDUAL" ? (
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            {formData.type === "BUSINESS" && (
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleInputChange}
                />
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select onValueChange={handleStateChange} value={formData.state}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.states.map((state) => (
                    <SelectItem key={state.code} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            {items.map((item, index) => (
              <div
                key={index}
                className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto]"
              >
                <div>
                  <Label>Item Name</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => handleItemChange(index, "name", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) =>
                      handleItemChange(index, "unitPrice", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>HSN Code</Label>
                  <Select
                    value={item.hsnCode}
                    onValueChange={(value) => handleItemChange(index, "hsnCode", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select HSN" />
                    </SelectTrigger>
                    <SelectContent>
                      {hsnCodes.hsnCodes.map((hsn) => (
                        <SelectItem key={hsn.code} value={hsn.code}>
                          {hsn.code} - {hsn.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(index, "quantity", Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input type="number" value={item.total.toFixed(2)} disabled />
                </div>
                {formData.state === "West Bengal" ? (
                  <>
                    <div>
                      <Label>CGST @{(item.taxRate/2).toFixed(1)}%</Label>
                      <Input
                        type="number"
                        value={item.cgst.toFixed(2)}
                        disabled
                      />
                    </div>
                    <div>
                      <Label>SGST @{(item.taxRate/2).toFixed(1)}%</Label>
                      <Input
                        type="number"
                        value={item.sgst.toFixed(2)}
                        disabled
                      />
                    </div>
                  </>
                ) : (
                  <div className="col-span-2">
                    <Label>IGST @{item.taxRate}%</Label>
                    <Input
                      type="number"
                      value={item.igst.toFixed(2)}
                      disabled
                    />
                  </div>
                )}
                <div>
                  <Label>Total</Label>
                  <Input type="number" value={item.totalWithTax.toFixed(2)} disabled />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={index === 0 && items.length === 1}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex justify-end space-x-4">
              <div className="w-1/4">
                <Label>Subtotal</Label>
                <Input type="number" value={subtotal.toFixed(2)} disabled />
              </div>
            </div>

            {formData.state === "West Bengal" ? (
              <div className="flex justify-end space-x-4">
                <div className="w-1/4">
                  <Label>CGST</Label>
                  <Input type="number" value={cgst.toFixed(2)} disabled />
                </div>
                <div className="w-1/4">
                  <Label>SGST</Label>
                  <Input type="number" value={sgst.toFixed(2)} disabled />
                </div>
              </div>
            ) : (
              <div className="flex justify-end space-x-4">
                <div className="w-1/4">
                  <Label>IGST</Label>
                  <Input type="number" value={igst.toFixed(2)} disabled />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <div className="w-1/4">
                <Label>Grand Total</Label>
                <Input type="number" value={total.toFixed(2)} disabled />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/dashboard/invoices">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}


import path from "path";
import fs from "fs";
import * as Puppeteer from 'puppeteer';

const isServerless = process.env.AWS_EXECUTION_ENV || process.env.VERCEL;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let puppeteer: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chromium: any = undefined;
if (isServerless) {
  // Dynamic import for serverless
  puppeteer = await import('puppeteer-core');
  chromium = await import('@sparticuz/chromium');
} else {
  puppeteer = Puppeteer;
}

export type InvoiceItem = {
  name: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxRate: number;
  totalWithTax: number;
};

// Define the Invoice type if not imported from elsewhere
type Invoice = {
  invoiceNo: string;
  createdAt: string | Date;
  patientName: string | null;
  isGstRegistered: boolean;
  companyName?: string | null;
  gstin?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  items: InvoiceItem[];
  phone?: string | null;
  email?: string | null;
  status: 'PENDING' | 'PAID';
  bankDetails?: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    qrCodeImagePath: string;
  } | null;
};

export async function generateInvoicePDF(invoice: Invoice & { items: InvoiceItem[] }) {
  try {
    // Precompute base64 images (cannot use await inside template literal)
    const logoBase64 = await getLogoBase64();
    const signatureBase64 = await getSignatureBase64();

    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page {
              margin: 0;
              size: A4;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              font-size: 10px;
              color: #333;
            }
            .invoice-container {
              padding: 20px;
              position: relative;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 15px;
              border-bottom: 1px solid #e0e0e0;
              padding-bottom: 10px;
            }
            .logo {
              width: 150px;
              height: auto;
            }
            .company-details {
              text-align: right;
              font-size: 9px;
              line-height: 0.5;
            }
            .invoice-title {
              color: #333;
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
            }
            .main-content {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
            }
            .billing-details, .invoice-details {
              width: 48%;
              font-size: 9px;
              line-height: 0.6;
            }
            .billing-details h3, .invoice-details h3 {
              color: #333;
              margin: 0 0 5px 0;
              font-size: 11px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 9px;
            }
            th {
              background-color: #f5f5f5;
              color: #333;
              padding: 5px;
              text-align: left;
              border: 1px solid #ddd;
            }
            td {
              padding: 5px;
              border: 1px solid #ddd;
            }
            .totals {
              width: 250px;
              margin-left: auto;
              font-size: 9px;
            }
            .totals p {
              margin: 3px 0;
              display: flex;
              justify-content: space-between;
            }
            .total-row {
              background-color: #f5f5f5;
              font-weight: bold;
              padding: 5px;
              margin-top: 5px;
            }
            .page-number {
              position: fixed;
              bottom: 10px;
              right: 10px;
              font-size: 8px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <img src="data:image/png;base64,${logoBase64}" class="logo" alt="Logo">
              <div class="company-details">
                <p>SH-8, 14/1 Subhas pally, Opp.- Hindustan transport building, Near- ISI college, Kolkata – 700108</p>
                <p>rewalkclinic@gmail.com | +91 81003 98976, +91 9171279127</p>
                <p>GSTIN: 19ABLFR1098P1Z8</p>
              </div>
            </div>
            
            <div class="main-content">
              <div class="billing-details">
                <h3>Bill To:</h3>
                ${invoice.isGstRegistered ? `
                  <p>${invoice.companyName}</p>
                  ${invoice.gstin ? `<p><strong>GSTIN:</strong> ${invoice.gstin}</p>` : ''}
                ` : `
                  <p>${invoice.patientName}</p>
                `}
                ${invoice.addressLine1 ? `
                  <p><strong>Address:</strong> ${invoice.addressLine1}</p>
                  ${invoice.city && invoice.state && invoice.pincode ? 
                    `<p>${invoice.city}, ${invoice.state} - ${invoice.pincode}</p>` : ''}
                ` : ''}
                ${invoice.phone ? `<p><strong>Phone:</strong> ${invoice.phone}</p>` : ''}
                ${invoice.email ? `<p><strong>Email:</strong> ${invoice.email}</p>` : ''}
              </div>
              
              <div class="invoice-details">
                <h3>Invoice Details:</h3>
                <p><strong>Invoice No:</strong> ${invoice.invoiceNo}</p>
                <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>HSN</th>
                  <th>Qty</th>
                  <th>Price/ Unit</th>
                  <th>Taxable Amount</th>
                  ${invoice.state === "West Bengal" ? `
                    <th>CGST</th>
                    <th>SGST</th>
                  ` : `
                    <th>IGST</th>
                  `}
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => {
                  const taxAmount = item.total * (item.taxRate / 100);
                  const cgstAmount = invoice.state === "West Bengal" ? taxAmount / 2 : 0;
                  const sgstAmount = invoice.state === "West Bengal" ? taxAmount / 2 : 0;
                  const igstAmount = invoice.state !== "West Bengal" ? taxAmount : 0;
                  const cgstRate = invoice.state === "West Bengal" ? (item.taxRate / 2) : 0;
                  const sgstRate = invoice.state === "West Bengal" ? (item.taxRate / 2) : 0;
                  const igstRate = invoice.state !== "West Bengal" ? item.taxRate : 0;
                  
                  return `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.hsnCode}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.unitPrice.toFixed(2)}</td>
                      <td>₹${item.total.toFixed(2)}</td>
                      ${invoice.state === "West Bengal" ? `
                        <td>₹${cgstAmount.toFixed(2)} (${cgstRate}%)</td>
                        <td>₹${sgstAmount.toFixed(2)} (${sgstRate}%)</td>
                      ` : `
                        <td>₹${igstAmount.toFixed(2)} (${igstRate}%)</td>
                      `}
                      <td>₹${item.totalWithTax.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <p><span>Subtotal:</span> <span>₹${invoice.subtotal.toFixed(2)}</span></p>
              ${invoice.state === "West Bengal" ? `
                <p><span>CGST:</span> <span>₹${invoice.cgst.toFixed(2)}</span></p>
                <p><span>SGST:</span> <span>₹${invoice.sgst.toFixed(2)}</span></p>
              ` : `
                <p><span>IGST:</span> <span>₹${invoice.igst.toFixed(2)}</span></p>
              `}
              <div class="total-row">
                <span>Total:</span>
                <span>₹${invoice.total.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Paid Amount:</span>
                <span>₹${invoice.status === 'PAID' ? invoice.total.toFixed(2) : '0.00'}</span>
              </div>
            </div>

            <div style="margin-top: 10px; text-align: right;">
              <p style="margin: 0; font-size: 9px;">Authorised Signature</p>
              <img src="data:image/png;base64,${signatureBase64}" style="width: 100px; height: auto; margin-top: 10px;" alt="Signature">
            </div>

            ${invoice.status === 'PENDING' ? `
              <div style="display: flex; margin-top: 20px; gap: 20px;">
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 10px 0; font-size: 11px;">Bank Details:</h3>
                  <p style="margin: 3px 0; font-size: 9px;"><strong>Bank Name:</strong> AXIS BANK</p>
                  <p style="margin: 3px 0; font-size: 9px;"><strong>Account Number:</strong> 924020071859005</p>
                  <p style="margin: 3px 0; font-size: 9px;"><strong>IFSC Code:</strong> UTIB0001592</p>
                  <p style="margin: 3px 0; font-size: 9px;"><strong>Branch:</strong> BARANAGAR, KOLKATA W.B- 700036</p>
                  <p style="margin: 3px 0; font-size: 9px;"><strong>Account Holder:</strong> REWALK CLINIC</p>
                </div>
              </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;


    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let browser: any;
    if (isServerless && chromium) {
      const executablePath: string = chromium.executablePath;
      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath,
        headless: true,
      });
    } else {
      browser = await puppeteer.launch({ headless: true });
    }

    // Create a new page
    const page = await browser.newPage();

    // Set the content of the page
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    // Add page numbers
    await page.evaluate(() => {
      const pages = document.querySelectorAll('.page');
      pages.forEach((page, index) => {
        const pageNumber = document.createElement('div');
        pageNumber.className = 'page-number';
        pageNumber.textContent = `Page ${index + 1} of ${pages.length}`;
        page.appendChild(pageNumber);
      });
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10px',
        right: '10px',
        bottom: '20px',
        left: '10px'
      }
    });

    // Close the browser
    await browser.close();

    return pdf;
  } catch (error) {
    throw error;
  }
}

// Helper function to get logo base64
async function getLogoBase64(): Promise<string> {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo", "logo.png");
    if (fs.existsSync(logoPath)) {
      const imageData = fs.readFileSync(logoPath);
      return imageData.toString('base64');
    }
    return '';
  } catch (error) {
    console.error('Error reading logo:', error);
    return '';
  }
}

// Helper function to get signature base64
async function getSignatureBase64(): Promise<string> {
  try {
    const signaturePath = path.join(process.cwd(), "public", "img", "sign.png");
    if (fs.existsSync(signaturePath)) {
      const imageData = fs.readFileSync(signaturePath);
      return imageData.toString('base64');
    }
    return '';
  } catch (error) {
    console.error('Error reading signature:', error);
    return '';
  }
}

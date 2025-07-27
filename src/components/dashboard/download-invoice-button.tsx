import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface DownloadInvoiceButtonProps {
  invoiceId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
}

export function DownloadInvoiceButton({ 
  invoiceId, 
  variant = "ghost",
  size = "icon",
  showIcon = true 
}: DownloadInvoiceButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}/download`);
        if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to download invoice');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.split('filename=')[1]?.replace(/["']/g, '') || 'invoice.pdf';
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Invoice downloaded",
        description: "The invoice has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Download failed",
        description: "There was an error downloading the invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showIcon ? (
        <Download className="h-4 w-4" />
      ) : null}
    </Button>
  );
}

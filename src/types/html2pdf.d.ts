declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number;
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: 'portrait' | 'landscape';
    };
  }

  interface Html2PdfInstance {
    set(options: Html2PdfOptions): Html2PdfInstance;
    from(element: string | HTMLElement): Html2PdfInstance;
    outputPdf(type: 'arraybuffer'): Promise<ArrayBuffer>;
    save(): Promise<void>;
  }

  function html2pdf(): Html2PdfInstance;
  export = html2pdf;
} 
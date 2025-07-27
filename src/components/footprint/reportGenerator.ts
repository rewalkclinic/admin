// src/reportGenerator.ts
import { jsPDF } from "jspdf";

interface ReportData {
  leftImageUrl: string;
  rightImageUrl: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  reportDate: string;
  reportId: string;
  findings: string;
}

export const generatePDF = async (data: ReportData): Promise<void> => {
  try {
    // Create a new PDF document
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Set default margin
    const margin = 15;
    let currentY = margin;

    // Draw company logo
    try {
      const logoWidth = 60;
      const logoHeight = 13;
      pdf.addImage(
        "/logo/logo.png",
        "PNG",
        (pageWidth - logoWidth) / 2,
        currentY,
        logoWidth,
        logoHeight
      );
    } catch (logoErr) {
      console.error("Error adding logo:", logoErr);
      // Fallback to text if logo loading fails
      pdf.setFillColor(0, 102, 204);
      pdf.rect((pageWidth - 50) / 2, currentY, 50, 15, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.text("REWALK CLINIC", pageWidth / 2, currentY + 10, {
        align: "center",
      });
    }

    currentY += 20;

    // Reset text color to black
    pdf.setTextColor(0, 0, 0);

    // Add address information
    pdf.setFontSize(9);
    pdf.text(
      "SH-8, 14/1 Subhash pally, Opp.- Hindustan transport building, Near- ISI college, Kolkata-700108",
      pageWidth / 2,
      currentY,
      { align: "center" }
    );

    currentY += 5;

    // Add contact information
    pdf.text(
      "rewalkclinic@gmail.com | +91 81003 98976, +91 9171279127",
      pageWidth / 2,
      currentY,
      { align: "center" }
    );

    currentY += 7;

    // Draw a horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, currentY, pageWidth - margin, currentY);

    currentY += 7;

    // Add report title
    pdf.setFontSize(16);
    pdf.setTextColor(20, 151, 212); // Blue color
    pdf.text("Rewalk Foot Care Test Report", pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 5;

    // Reset text color to black
    pdf.setTextColor(0, 0, 0);

    // Draw a horizontal line
    pdf.line(margin, currentY, pageWidth - margin, currentY);

    currentY += 10;

    // Add patient ID and date
    pdf.setFontSize(10);
    pdf.text(`ID: ${data.reportId}`, margin, currentY);
    pdf.text(`Date: ${data.reportDate}`, pageWidth - margin, currentY, {
      align: "right",
    });

    currentY += 6;

    // Add patient name, age and gender
    pdf.text(`Name: ${data.patientName}`, margin, currentY);
    pdf.text(`Age: ${data.patientAge} Years`, pageWidth / 2, currentY, {
      align: "center",
    });
    pdf.text(`Gender: ${data.patientGender}`, pageWidth - margin, currentY, {
      align: "right",
    });

    currentY += 10;

    pdf.line(margin, currentY - 6, pageWidth - margin, currentY - 6);
    


    // Maximize footprint image size, keep both on one page
    const reservedHeight = 90; // header, info, findings, legend, footer
    const availableHeight = pageHeight - currentY - reservedHeight;
    const availableWidth = pageWidth - 2 * margin;
    const gap = 10; // gap between images
    const imageWidth = (availableWidth - gap) / 2;
    // Increase max image height from 140mm to 170mm
    const imageHeight = availableHeight > 190 ? 190 : availableHeight; // max 190mm, but fit in available

    // Add image labels
    pdf.setFontSize(12);
    pdf.text("Left", margin + imageWidth / 2, currentY, { align: "center" });
    pdf.text("Right", margin + imageWidth + gap + imageWidth / 2, currentY, { align: "center" });
    currentY += 5;

    // Add images side by side, fixed size
    const addImageFixed = async (dataUrl: string, x: number, y: number, width: number, height: number) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          // Center image vertically if aspect ratio doesn't match
          let drawWidth = width;
          let drawHeight = height;
          const aspectRatio = img.width / img.height;
          if (img.height > 0 && img.width > 0) {
            if (img.width / width > img.height / height) {
              drawHeight = width / aspectRatio;
              if (drawHeight > height) drawHeight = height;
              drawWidth = drawHeight * aspectRatio;
            } else {
              drawWidth = height * aspectRatio;
              if (drawWidth > width) drawWidth = width;
              drawHeight = drawWidth / aspectRatio;
            }
          }
          const xPad = x + (width - drawWidth) / 2;
          const yPad = y + (height - drawHeight) / 2;
          pdf.addImage(dataUrl, "PNG", xPad, yPad, drawWidth, drawHeight);
          resolve();
        };
        img.onerror = (err) => reject(err);
        img.src = dataUrl;
      });
    };

    try {
      await addImageFixed(data.leftImageUrl, margin, currentY, imageWidth, imageHeight);
      await addImageFixed(data.rightImageUrl, margin + imageWidth + gap, currentY, imageWidth, imageHeight);
      currentY += imageHeight + 10;
    } catch (imageErr) {
      console.error("Error adding images to PDF:", imageErr);
      currentY += imageHeight + 10;
    }

    // Draw another horizontal line
    pdf.line(margin, currentY, pageWidth - margin, currentY);

    currentY += 7;

    // Add findings section
    pdf.setFontSize(11);
    pdf.text("Findings:", margin, currentY);

    currentY += 5;

    // Split findings text into multiple lines if needed
    const splitFindings = pdf.splitTextToSize(
      data.findings,
      pageWidth - 2 * margin
    );
    pdf.text(splitFindings, margin, currentY);

    currentY += splitFindings.length * 5 + 10;

    // Add pressure legend
    pdf.setFontSize(10);
    pdf.text("Pressure Legend:", margin, currentY);

    currentY += 5;

    // Draw color gradient for legend
    const gradientWidth = 100;
    const gradientHeight = 5;
    const segments = 5; // Simplified to 5 distinct color segments
    const segmentWidth = gradientWidth / segments;

    // Use pre-defined color stops for legend
    const colorStops = [
      { value: 0.0, color: [0, 0, 255] }, // Blue (very low pressure)
      { value: 0.25, color: [6, 158, 6] }, // Green (low pressure)
      { value: 0.5, color: [198, 198, 7] }, // Yellow (medium pressure)
      { value: 0.75, color: [243, 110, 2] }, // Orange (medium-high pressure)
      { value: 1.0, color: [255, 0, 0] }, // Red (high pressure)
    ];

    for (let i = 0; i < segments; i++) {
      const [r, g, b] = colorStops[i].color;
      pdf.setFillColor(r, g, b);
      pdf.rect(
        margin + i * segmentWidth,
        currentY,
        segmentWidth,
        gradientHeight,
        "F"
      );
    }

    currentY += gradientHeight + 3;

    // Add legend labels
    pdf.setFontSize(8);
    const labels = [
      { text: "Low", x: margin },
      { text: "Low-Medium", x: margin + segmentWidth },
      { text: "Medium", x: margin + segmentWidth * 2 },
      { text: "Medium-High", x: margin + segmentWidth * 3 },
      { text: "High", x: margin + segmentWidth * 4 },
    ];

    labels.forEach((label) => {
      pdf.text(label.text, label.x, currentY);
    });

    // Add website
    currentY = pageHeight - 10;
    pdf.setFontSize(8);

    // Draw a horizontal line at the bottom of the page
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, pageHeight - 7, pageWidth - margin, pageHeight - 7);

    // Save PDF and force download
    const filename = `rewalk_foot_analysis_${data.reportId}.pdf`;
    pdf.save(filename);

    return Promise.resolve();
  } catch (error) {
    console.error("Error generating PDF:", error);
    return Promise.reject(error);
  }
};

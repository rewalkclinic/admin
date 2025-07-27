// src/components/Dashboard.tsx
"use client";
import React, { useState, useRef } from "react";
import { processImage } from "@/components/footprint/imageProcessing";
import { generatePDF } from "@/components/footprint/reportGenerator";
import { User, Calendar, Venus, Upload, Search, FileText, Loader2 } from "lucide-react";

function Dashboard() {

  // Image states
  const [leftFootImage, setLeftFootImage] = useState<HTMLImageElement | null>(null);
  const [rightFootImage, setRightFootImage] = useState<HTMLImageElement | null>(null);
  const [processedLeftImage, setProcessedLeftImage] = useState<string | null>(null);
  const [processedRightImage, setProcessedRightImage] = useState<string | null>(null);
  
  // UI states
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  
  // Patient information
  const [patientName, setPatientName] = useState<string>("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientGender, setPatientGender] = useState<string>("Male");
  const [findings, setFindings] = useState<string>("");

  // Canvas references for image processing
  const canvasRefs = {
    leftOriginal: useRef<HTMLCanvasElement>(null),
    rightOriginal: useRef<HTMLCanvasElement>(null),
    leftProcessed: useRef<HTMLCanvasElement>(null),
    rightProcessed: useRef<HTMLCanvasElement>(null),
  };

  // Handle image upload
  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    foot: "left" | "right"
  ): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = () => {
        if (foot === "left") {
          setLeftFootImage(img);
        } else {
          setRightFootImage(img);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Reduce image quality for processing
  const reduceImageQuality = (image: HTMLImageElement, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      // Create temporary canvas
      const canvas = document.createElement('canvas');
      
      // Set canvas dimensions to match image (or optionally scale down)
      const maxDimension = 1000; // Max dimension for either width or height
      let width = image.width;
      let height = image.height;
      
      // Scale down if either dimension is too large
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image on canvas with reduced dimensions
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(image, 0, 0, width, height);
        
        // Convert to lower quality JPEG
        const reducedQualityImage = canvas.toDataURL('image/jpeg', quality);
        
        // Create a new image with the reduced quality
        const newImg = new Image();
        newImg.onload = () => resolve(reducedQualityImage);
        newImg.src = reducedQualityImage;
      } else {
        // Fallback if canvas context not available
        resolve(image.src);
      }
    });
  };

  // Scan foot images to generate pressure maps
  const scanFootImages = async (): Promise<void> => {
    if (!leftFootImage || !rightFootImage) {
      alert("Please upload both foot scan images.");
      return;
    }

    if (!patientName || !patientAge) {
      alert("Please enter patient name and age.");
      return;
    }

    setIsScanning(true);

    try {
      // Reduce image quality first
      const reducedLeftImageUrl = await reduceImageQuality(leftFootImage);
      const reducedRightImageUrl = await reduceImageQuality(rightFootImage);
      
      // Create new Image objects from reduced quality URLs
      const reducedLeftImg = new Image();
      const reducedRightImg = new Image();
      
      // Load reduced quality images
      await new Promise((resolve) => {
        let imagesLoaded = 0;
        
        reducedLeftImg.onload = () => {
          imagesLoaded++;
          if (imagesLoaded === 2) resolve(null);
        };
        
        reducedRightImg.onload = () => {
          imagesLoaded++;
          if (imagesLoaded === 2) resolve(null);
        };
        
        reducedLeftImg.src = reducedLeftImageUrl;
        reducedRightImg.src = reducedRightImageUrl;
      });

      // Process both reduced-quality images
      const leftProcessedUrl = await processImage(
        reducedLeftImg,
        canvasRefs.leftProcessed
      );
      const rightProcessedUrl = await processImage(
        reducedRightImg,
        canvasRefs.rightProcessed
      );

      // Store processed images
      setProcessedLeftImage(leftProcessedUrl);
      setProcessedRightImage(rightProcessedUrl);
      
      // Move to next step after processing
      setCurrentStep(2);
      
      // Do not set default findings text
      setFindings("");
      
    } catch (error) {
      console.error("Error processing images:", error);
      alert("Error processing images. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  // Generate PDF report
  const generateReport = async (): Promise<void> => {
    if (!processedLeftImage || !processedRightImage || !findings.trim()) {
      alert("Please ensure both foot images are processed and findings are entered.");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // Generate report date
      const reportDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      
      // Generate a unique ID for the report
      const reportId = generateReportId();

      // Generate PDF with all patient data
      await generatePDF({
        leftImageUrl: processedLeftImage,
        rightImageUrl: processedRightImage,
        patientName,
        patientAge,
        patientGender,
        reportDate,
        reportId,
        findings
      });
      
      // Move to confirmation step
      setCurrentStep(3);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF report. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Generate a unique report ID in the format: RFCRYYMMDDUUU
  const generateReportId = (): string => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(2); // Last 2 digits of year
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Generate a random 3-digit number
    const uniqueNum = Math.floor(Math.random() * 900) + 100; // 100-999
    
    return `RFCR${year}${month}${day}${uniqueNum}`;
  };

  // Reset the entire application
  const resetApplication = (): void => {
    setLeftFootImage(null);
    setRightFootImage(null);
    setProcessedLeftImage(null);
    setProcessedRightImage(null);
    setPatientName("");
    setPatientAge("");
    setPatientGender("Male");
    setFindings("");
    setCurrentStep(1);
  };

  // ...existing code...

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      <header className="text-center mb-8 pb-4 border-b border-gray-300">
        <h1 className="text-blue-600 text-2xl flex items-center justify-center gap-2">
          <Search className="text-blue-600" /> Foot Pressure Analysis Tool
        </h1>
      </header>

      <div className="flex justify-between mb-8 px-[10%]">
        {["Patient Info", "Analysis", "Report"].map((title, idx) => (
          <div key={title} className="flex flex-col items-center flex-1 relative">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 z-10 transition-all duration-300 ${currentStep >= idx+1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-white'}`}>{idx+1}</div>
            <div className={`text-center text-sm transition-all duration-300 ${currentStep >= idx+1 ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>{title}</div>
            {idx < 2 && <div className="absolute w-full h-[3px] bg-gray-300 top-5 left-1/2 z-0" style={{transform: 'translateX(-50%)'}}></div>}
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl mb-5 text-gray-900 flex items-center"><User className="mr-2 text-blue-600" /> Patient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="patientName" className="flex items-center mb-2 font-medium"><User className="mr-2 text-blue-600" /> Patient Name:</label>
                <input type="text" id="patientName" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Enter patient name" required className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label htmlFor="patientAge" className="flex items-center mb-2 font-medium"><Calendar className="mr-2 text-blue-600" /> Age (Years):</label>
                <input type="number" id="patientAge" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="Enter age" required className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label htmlFor="patientGender" className="flex items-center mb-2 font-medium"><Venus className="mr-2 text-blue-600" /> Gender:</label>
                <select id="patientGender" value={patientGender} onChange={(e) => setPatientGender(e.target.value)} className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl mb-5 text-gray-900 flex items-center"><Upload className="mr-2 text-blue-600" /> Upload Foot Scans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg mb-4 text-gray-900">Left Foot</h3>
                <div className={`border-2 rounded-lg p-6 text-center cursor-pointer transition-all h-[250px] relative overflow-hidden bg-gray-100 ${leftFootImage ? 'border-green-600 border-solid' : 'border-gray-300 border-dashed'}`}> 
                  {!leftFootImage ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <Upload className="text-4xl text-gray-500 mb-4" />
                      <label htmlFor="leftFootUpload" className="text-blue-600 font-medium cursor-pointer py-2 px-4 border border-blue-600 rounded-lg transition hover:bg-blue-600 hover:text-white">
                        Click to Browse
                        <input id="leftFootUpload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "left")} style={{ display: "none" }} />
                      </label>
                    </div>
                  ) : (
                    <div className="relative h-full flex justify-center items-center">
                      <canvas ref={canvasRefs.leftOriginal} style={{ display: "none" }} />
                      <img src={leftFootImage.src} alt="Left foot original" className="max-w-full max-h-full object-contain" />
                      <button className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white border-none py-2 px-4 rounded text-sm cursor-pointer" onClick={() => setLeftFootImage(null)}>
                        Change Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg mb-4 text-gray-900">Right Foot</h3>
                <div className={`border-2 rounded-lg p-6 text-center cursor-pointer transition-all h-[250px] relative overflow-hidden bg-gray-100 ${rightFootImage ? 'border-green-600 border-solid' : 'border-gray-300 border-dashed'}`}> 
                  {!rightFootImage ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <Upload className="text-4xl text-gray-500 mb-4" />
                      <label htmlFor="rightFootUpload" className="text-blue-600 font-medium cursor-pointer py-2 px-4 border border-blue-600 rounded-lg transition hover:bg-blue-600 hover:text-white">
                        Click to Browse
                        <input id="rightFootUpload" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "right")} style={{ display: "none" }} />
                      </label>
                    </div>
                  ) : (
                    <div className="relative h-full flex justify-center items-center">
                      <canvas ref={canvasRefs.rightOriginal} style={{ display: "none" }} />
                      <img src={rightFootImage.src} alt="Right foot original" className="max-w-full max-h-full object-contain" />
                      <button className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white border-none py-2 px-4 rounded text-sm cursor-pointer" onClick={() => setRightFootImage(null)}>
                        Change Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button onClick={scanFootImages} disabled={!leftFootImage || !rightFootImage || isScanning || !patientName || !patientAge} className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-white font-medium text-base transition bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed">
              {isScanning ? (
                <>
                  <Loader2 className="animate-spin" /> Scanning...
                </>
              ) : (
                <>
                  <Search /> Start Scan
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvases for processing */}
      <canvas ref={canvasRefs.leftProcessed} style={{ display: "none" }} />
      <canvas ref={canvasRefs.rightProcessed} style={{ display: "none" }} />

      {currentStep === 2 && processedLeftImage && processedRightImage && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl mb-5 text-gray-900 flex items-center"><Search className="mr-2 text-blue-600" /> Pressure Analysis Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="text-center">
                <h3 className="text-lg mb-2 text-gray-900">Left Foot Pressure Map</h3>
                <img src={processedLeftImage} alt="Processed left foot" className="max-w-full rounded-lg shadow mb-2" />
              </div>
              <div className="text-center">
                <h3 className="text-lg mb-2 text-gray-900">Right Foot Pressure Map</h3>
                <img src={processedRightImage} alt="Processed right foot" className="max-w-full rounded-lg shadow mb-2" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h3 className="text-lg mb-2 text-gray-900">Pressure Legend</h3>
              <div className="mb-2">
                <div className="w-full h-5 rounded bg-gradient-to-r from-blue-600 via-green-400 via-yellow-400 via-orange-400 to-red-600 mb-1"></div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low</span>
                  <span>Low-Medium</span>
                  <span>Medium</span>
                  <span>Medium-High</span>
                  <span>High</span>
                </div>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="text-lg mb-2 text-gray-900">Medical Findings</h3>
              <textarea id="findings" value={findings} onChange={(e) => setFindings(e.target.value)} rows={4} placeholder="Enter your analysis and findings here..." className="w-full min-h-[100px] p-4 border border-gray-300 rounded-lg text-base mb-4 resize-y focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <button className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-gray-100 text-gray-900 font-medium text-base transition hover:bg-gray-300" onClick={() => setCurrentStep(1)}>
                Back
              </button>
              <button onClick={generateReport} disabled={isGeneratingPDF || !findings.trim()} className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-orange-500 text-white font-medium text-base transition hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed">
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="animate-spin" /> Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText /> Generate PDF Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div>
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-5xl text-green-600 bg-green-100 w-[100px] h-[100px] rounded-full flex items-center justify-center mx-auto mb-6">✓</div>
            <h2 className="text-2xl mb-4 text-gray-900">Report Generated Successfully!</h2>
            <p className="mb-4 text-gray-500 max-w-xl mx-auto">The PDF report has been generated and downloaded successfully.</p>
            <p className="mb-4 text-gray-500 max-w-xl mx-auto">Report includes patient information, pressure maps, and your medical findings.</p>
            <div className="flex justify-center mt-6">
              <button className="flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-green-600 text-white font-medium text-base transition hover:bg-green-700" onClick={resetApplication}>
                Start New Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
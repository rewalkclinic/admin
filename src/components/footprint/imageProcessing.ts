// src/imageProcessing.ts

// Get color based on pressure value
export const getSmoothColor = (pressure: number): [number, number, number] => {
          // Adjusted color stops to make red/orange/yellow appear at lower pressure values
          const colorStops = [
            { value: 0.0, color: [0, 0, 255] }, // Blue (very low pressure)
            { value: 0.3, color: [6, 158, 6] }, // Green (low pressure)
            { value: 0.5, color: [198, 198, 7] }, // Yellow (medium pressure)
            { value: 0.6, color: [243, 110, 2] }, // Orange (medium-high pressure)
            { value: 0.7, color: [255, 0, 0] }, // Red (high pressure)
          ];
        
          // Find the two color stops that our pressure value falls between
          let lowerIndex = 0;
          for (let i = 0; i < colorStops.length - 1; i++) {
            if (
              pressure >= colorStops[i].value &&
              pressure <= colorStops[i + 1].value
            ) {
              lowerIndex = i;
              break;
            }
          }
        
          // If pressure is higher than our highest defined stop, use the highest color (red)
          if (pressure > colorStops[colorStops.length - 1].value) {
            return colorStops[colorStops.length - 1].color as [
              number,
              number,
              number
            ];
          }
        
          const lowerStop = colorStops[lowerIndex];
          const upperStop = colorStops[lowerIndex + 1];
        
          // Calculate how far between the two stops our pressure value is (0-1)
          const range = upperStop.value - lowerStop.value;
          const normalizedPosition =
            range === 0 ? 0 : (pressure - lowerStop.value) / range;
        
          // Interpolate between the two colors
          return [
            Math.round(
              lowerStop.color[0] +
                normalizedPosition * (upperStop.color[0] - lowerStop.color[0])
            ),
            Math.round(
              lowerStop.color[1] +
                normalizedPosition * (upperStop.color[1] - lowerStop.color[1])
            ),
            Math.round(
              lowerStop.color[2] +
                normalizedPosition * (upperStop.color[2] - lowerStop.color[2])
            ),
          ];
        };
        
        // Advanced image processing with Gaussian blur and smooth contours
        export const processImage = (
          img: HTMLImageElement,
          canvasRef: React.RefObject<HTMLCanvasElement>
        ): Promise<string> => {
          return new Promise((resolve) => {
            const canvas = canvasRef.current;
            if (!canvas) {
              throw new Error("Canvas reference is not available");
            }
        
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) {
              throw new Error("Could not get 2D context from canvas");
            }
        
            // Set canvas dimensions to match image
            canvas.width = img.width;
            canvas.height = img.height;
        
            // Draw original image on canvas
            ctx.drawImage(img, 0, 0, img.width, img.height);
        
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
        
            const width = canvas.width;
            const height = canvas.height;
        
            // Create arrays to store foot mask and pressure values
            const footMask = new Uint8Array(width * height);
            const pressureValues = new Float32Array(width * height);
        
            // Step 1: Convert to grayscale and detect foot outline
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const pixelIdx = y * width + x;
        
                // Calculate grayscale value (weighted RGB for better human perception)
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const a = data[idx + 3];
        
                // Using better grayscale conversion formula (human eye sensitivity)
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
                // If pixel is dark enough or has alpha channel, consider it part of foot
                // Decreased threshold from 245 to 220 to better isolate the foot area
                if (gray < 220 || a < 220) {
                  footMask[pixelIdx] = 1; // Mark as foot
        
                  // Calculate pressure (invert and normalize grayscale)
                  const rawPressure = 1 - gray / 255;
        
                  // Modified sigmoid curve
                  pressureValues[pixelIdx] =
                    1 / (1 + Math.exp(-12 * (rawPressure - 0.5))); // Increased midpoint from 0.4 to 0.5
                }
              }
            }
        
            // Step 2: Find the foot boundaries and apply dilation to ensure complete coverage
            const dilateFootMask = () => {
              const dilatedMask = new Uint8Array(width * height);
              const dilationRadius = 5;
        
              for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                  const pixelIdx = y * width + x;
        
                  // Skip if already part of foot
                  if (footMask[pixelIdx] === 1) {
                    dilatedMask[pixelIdx] = 1;
                    continue;
                  }
        
                  // Check neighbors within dilation radius
                  let hasFootNeighbor = false;
                  for (
                    let dy = -dilationRadius;
                    dy <= dilationRadius && !hasFootNeighbor;
                    dy++
                  ) {
                    for (
                      let dx = -dilationRadius;
                      dx <= dilationRadius && !hasFootNeighbor;
                      dx++
                    ) {
                      const nx = x + dx;
                      const ny = y + dy;
        
                      // Skip if out of bounds
                      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        
                      const neighborIdx = ny * width + nx;
                      if (footMask[neighborIdx] === 1) {
                        hasFootNeighbor = true;
                        break;
                      }
                    }
                  }
        
                  dilatedMask[pixelIdx] = hasFootNeighbor ? 1 : 0;
                }
              }
        
              return dilatedMask;
            };
        
            const dilatedFootMask = dilateFootMask();
        
            // Step 3: Apply Gaussian blur to the pressure values for smooth transitions
            const applyGaussianBlur = (
              values: Float32Array,
              mask: Uint8Array
            ): Float32Array => {
              const blurredValues = new Float32Array(width * height);
              const sigma = 3.0; // Blur radius
              const kernelSize = Math.ceil(sigma * 3) * 2 + 1; // Ensure odd kernel size
              const halfKernel = Math.floor(kernelSize / 2);
        
              // Pre-compute gaussian kernel
              const kernel: number[] = [];
              let kernelSum = 0;
        
              for (let y = -halfKernel; y <= halfKernel; y++) {
                for (let x = -halfKernel; x <= halfKernel; x++) {
                  const exponent = -(x * x + y * y) / (2 * sigma * sigma);
                  const value = Math.exp(exponent) / (2 * Math.PI * sigma * sigma);
                  kernel.push(value);
                  kernelSum += value;
                }
              }
        
              // Normalize kernel
              for (let i = 0; i < kernel.length; i++) {
                kernel[i] /= kernelSum;
              }
        
              // Apply gaussian blur
              for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                  const pixelIdx = y * width + x;
        
                  // Skip pixels not part of the foot
                  if (mask[pixelIdx] !== 1) {
                    blurredValues[pixelIdx] = 0;
                    continue;
                  }
        
                  let weightedSum = 0;
                  let kernelWeightSum = 0;
                  let kernelIndex = 0;
        
                  for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                    for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                      const nx = x + kx;
                      const ny = y + ky;
        
                      // Skip if out of bounds
                      if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
                        kernelIndex++;
                        continue;
                      }
        
                      const neighborIdx = ny * width + nx;
                      // Only include foot pixels in blur calculation
                      if (mask[neighborIdx] === 1) {
                        weightedSum += values[neighborIdx] * kernel[kernelIndex];
                        kernelWeightSum += kernel[kernelIndex];
                      }
        
                      kernelIndex++;
                    }
                  }
        
                  // Normalize by the sum of weights actually used
                  blurredValues[pixelIdx] =
                    kernelWeightSum > 0 ? weightedSum / kernelWeightSum : 0;
                }
              }
        
              return blurredValues;
            };
        
            // Apply multiple blur passes for smoother results
            let smoothedPressure = pressureValues;
            for (let i = 0; i < 3; i++) {
              smoothedPressure = new Float32Array(
                applyGaussianBlur(smoothedPressure, dilatedFootMask)
              );
            }
        
            // Step 4: Enhanced pressure normalization to better distribute colors
            let minPressure = 1.0;
            let maxPressure = 0.0;
        
            // Find min and max pressure values
            for (let i = 0; i < width * height; i++) {
              if (dilatedFootMask[i] === 1 && smoothedPressure[i] > 0) {
                minPressure = Math.min(minPressure, smoothedPressure[i]);
                maxPressure = Math.max(maxPressure, smoothedPressure[i]);
              }
            }
        
            // Enhance contrast to make differences more visible
            // Apply a power curve to emphasize mid to high pressure regions
            const pressureRange = maxPressure - minPressure;
            if (pressureRange > 0) {
              for (let i = 0; i < width * height; i++) {
                if (dilatedFootMask[i] === 1) {
                  // Normalize to 0-1 range
                  let normalizedPressure =
                    (smoothedPressure[i] - minPressure) / pressureRange;
        
                  // Apply power curve to enhance contrast (values > 0.5 get boosted)
                  normalizedPressure = Math.pow(normalizedPressure, 0.8);
        
                  // Store enhanced values
                  smoothedPressure[i] = normalizedPressure;
                }
              }
            }
        
            // Step 5: Apply the colors based on normalized pressure values
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const pixelIdx = y * width + x;
        
                // Apply transparency to non-foot areas
                if (dilatedFootMask[pixelIdx] !== 1) {
                  data[idx + 3] = 0; // Fully transparent
                  continue;
                }
        
                // Get smooth color from pressure
                const [r, g, b] = getSmoothColor(smoothedPressure[pixelIdx]);
        
                // Apply color
                data[idx] = r;
                data[idx + 1] = g;
                data[idx + 2] = b;
                data[idx + 3] = 255; // Fully opaque
              }
            }
        
            // Put processed data back on canvas
            ctx.putImageData(imageData, 0, 0);
        
            // Return the processed canvas as a data URL
            resolve(canvas.toDataURL("image/png"));
          });
        };
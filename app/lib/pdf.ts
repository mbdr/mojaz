/**
 * PDF Utility Functions
 */

/**
 * Convert Base64 string to Blob
 */
export function base64ToBlob(base64: string, mimeType: string = "application/pdf"): Blob {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch {
    throw new Error("Failed to convert Base64 to Blob");
  }
}

/**
 * Download PDF from Base64
 */
export function downloadPdf(base64: string, filename: string = "vehicle-report.pdf"): void {
  try {
    const blob = base64ToBlob(base64);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    throw new Error("Failed to download PDF");
  }
}

/**
 * Get PDF data URL from Base64
 */
export function getPdfDataUrl(base64: string): string {
  return `data:application/pdf;base64,${base64}`;
}

/**
 * Validate PDF Base64 (check for PDF header)
 */
export function validatePdfBase64(base64: string): boolean {
  try {
    const binaryString = atob(base64.substring(0, 100)); // Check first 100 chars
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    // PDF header: %PDF
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  } catch {
    return false;
  }
}

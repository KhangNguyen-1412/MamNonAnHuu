/**
 * printHelper.ts
 * Elegant front-end print utility that creates a sandboxed hidden iframe,
 * copies styles from the document context (Tailwind, Lora, Playfair font files),
 * overrides page size setting specifically for official A4 dimensions,
 * and launches the system print dialog seamlessly.
 */

export function printElement(element: HTMLElement | string, title: string = "Document-Print") {
  const printElement = typeof element === 'string' ? document.getElementById(element) : element;
  if (!printElement) {
    console.error(`Printable element not found`, element);
    return;
  }

  // Create clean iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    console.error("Failed to access iframe document");
    return;
  }

  // Set document Title so file export or PDF name is official
  doc.title = title;

  // Clone head stylesheets (Tailwind, typography, external stylesheets)
  const headElements = document.head.cloneNode(true) as HTMLHeadElement;
  doc.head.innerHTML = headElements.innerHTML;

  // Add custom print styling overrides
  const style = doc.createElement('style');
  style.innerHTML = `
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      background-color: white !important;
      color: #1e2a3a !important;
      font-family: 'Lora', 'Georgia', serif !important;
      padding: 0 !important;
      margin: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-avoid-break {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Ensure high contrast for ink-jet paper print */
    table {
      border-collapse: collapse !important;
    }
    th, td {
      border-color: #8c7e6b !important;
    }
  `;
  doc.head.appendChild(style);

  // Clone the printable block's HTML structure
  // We use cloneNode to keep accurate class references
  const bodyContent = printElement.cloneNode(true) as HTMLElement;
  doc.body.appendChild(bodyContent);

  // Trigger browser printing window
  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    // Safely prune the background iframe
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
}

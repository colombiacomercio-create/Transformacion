const fs = require('fs');
const file1 = 'frontend/src/components/gestion/FichasDecoradas.tsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(
  'className="bg-white w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md relative page-break-after-always"',
  'className="pdf-page bg-white w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md relative"'
);
content1 = content1.replace(
  'className="bg-white w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md relative"',
  'className="pdf-page bg-white w-[210mm] min-h-[297mm] mx-auto p-8 shadow-md relative"'
);
fs.writeFileSync(file1, content1);

const file2 = 'frontend/src/components/gestion/SeccionResultados.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
const oldExport = `  const exportPDF = async () => {
    const el = document.getElementById('ficha-pdf-container');
    if (!el) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(\`Ficha_Resultados_\${new Date().toISOString().slice(0, 10)}.pdf\`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setExporting(false);
    }
  };`;

const newExport = `  const exportPDF = async () => {
    const pages = document.querySelectorAll('.pdf-page');
    if (!pages || pages.length === 0) {
      // Fallback
      const el = document.getElementById('ficha-pdf-container');
      if (!el) return;
      setExporting(true);
      try {
        const canvas = await html2canvas(el, { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(\`Ficha_Resultados_\${new Date().toISOString().slice(0, 10)}.pdf\`);
      } catch (err) { console.error(err); } finally { setExporting(false); }
      return;
    }

    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage();
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      pdf.save(\`Ficha_Resultados_\${new Date().toISOString().slice(0, 10)}.pdf\`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setExporting(false);
    }
  };`;

content2 = content2.replace(oldExport, newExport);
fs.writeFileSync(file2, content2);
console.log('Fixed exportPDF');

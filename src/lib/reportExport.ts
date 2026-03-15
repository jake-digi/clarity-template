import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportCSV(columns: string[], rows: string[][], filename: string) {
  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const header = columns.map(escape).join(",");
  const body = rows.map((r) => r.map(escape).join(",")).join("\n");
  const csv = `${header}\n${body}`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(
  title: string,
  columns: string[],
  rows: string[][],
  summaryLines: string[],
  filename: string
) {
  const doc = new jsPDF({ orientation: rows[0]?.length > 5 ? "landscape" : "portrait" });

  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 20);

  // Summary
  doc.setFontSize(10);
  doc.setTextColor(100);
  summaryLines.forEach((line, i) => {
    doc.text(line, 14, 30 + i * 6);
  });

  // Table
  autoTable(doc, {
    startY: 30 + summaryLines.length * 6 + 4,
    head: [columns],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [0, 120, 200], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  doc.save(`${filename}.pdf`);
}

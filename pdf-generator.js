
import { jsPDF } from "jspdf";
export async function exportToPDF(state){
  const doc = new jsPDF();
  doc.text("PDF generatie nog te implementeren in repository", 10, 10);
  doc.save("emigratiedossier.pdf");
}

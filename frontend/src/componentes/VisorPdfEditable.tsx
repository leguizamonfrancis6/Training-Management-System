import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import urlWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import "pdfjs-dist/web/pdf_viewer.css";

// Lo que la página que usa el visor le puede pedir.
export interface ControlVisor {
  // Devuelve el PDF con lo que se escribió en los campos.
  obtenerPdf: () => Promise<Uint8Array>;
}

// Muestra un PDF con campos rellenables (pdf.js, de Mozilla) para completarlo dentro de la página.
// El PDF original no se toca: lo escrito queda en memoria hasta que se pide con obtenerPdf().
const VisorPdfEditable = forwardRef<ControlVisor, { datos: Uint8Array }>(function VisorPdfEditable({ datos }, ref) {
  const contenedor = useRef<HTMLDivElement>(null);
  const documento = useRef<PDFDocumentProxy | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useImperativeHandle(ref, () => ({
    obtenerPdf: async () => {
      if (!documento.current) throw new Error("La planilla todavía no terminó de cargar");
      return documento.current.saveDocument(); // incluye lo escrito en los campos
    },
  }));

  useEffect(() => {
    let cancelado = false;

    (async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = urlWorker;
      // El visor de pdf.js busca la librería en globalThis.pdfjsLib: por eso se carga después.
      (globalThis as unknown as { pdfjsLib: typeof pdfjs }).pdfjsLib = pdfjs;
      const { EventBus, PDFLinkService, PDFViewer } = await import("pdfjs-dist/web/pdf_viewer.mjs");

      // slice(): pdf.js se queda con el buffer que recibe; así no se pierde el original.
      const doc = await pdfjs.getDocument({ data: datos.slice() }).promise;
      if (cancelado || !contenedor.current) {
        doc.destroy();
        return;
      }
      documento.current = doc;

      const eventBus = new EventBus();
      const linkService = new PDFLinkService({ eventBus });
      const visor = new PDFViewer({
        container: contenedor.current,
        eventBus,
        linkService,
        annotationMode: pdfjs.AnnotationMode.ENABLE_FORMS, // campos editables
      });
      linkService.setViewer(visor);
      eventBus.on("pagesinit", () => {
        visor.currentScaleValue = "page-width"; // la hoja ocupa todo el ancho disponible
        setCargando(false);
      });
      visor.setDocument(doc);
      linkService.setDocument(doc);
    })().catch((err: unknown) => {
      if (!cancelado) setError(err instanceof Error ? err.message : "No se pudo abrir el PDF");
    });

    return () => {
      cancelado = true;
      documento.current?.destroy();
      documento.current = null;
    };
  }, [datos]);

  return (
    <div className="visor-pdf-marco">
      {error && <p className="mensaje-error">{error}</p>}
      {cargando && !error && <p className="visor-pdf-cargando">Cargando planilla…</p>}
      {/* pdf.js necesita un contenedor con posición absoluta y adentro un div "pdfViewer" */}
      <div ref={contenedor} className="visor-pdf">
        <div className="pdfViewer" />
      </div>
    </div>
  );
});

export default VisorPdfEditable;

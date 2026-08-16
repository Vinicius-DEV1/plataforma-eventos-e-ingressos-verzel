import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useId, useRef } from 'react';

// Decodes entirely in the browser via getUserMedia (DECISIONS.md — Leitura
// de QR): only the resulting text (the ticket JWT) ever reaches the
// backend, no image is uploaded anywhere.
export function QrScanner({
  onScan,
  active,
}: {
  onScan: (code: string) => void;
  active: boolean;
}) {
  const elementId = useId().replace(/:/g, '');
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    if (!active) return;

    const scanner = new Html5Qrcode(elementId);
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => onScanRef.current(decodedText),
        () => {
          // "nenhum QR neste frame" — esperado a cada frame sem código, ignorar.
        },
      )
      .catch(() => {
        // Sem câmera ou permissão negada — a digitação manual continua
        // disponível como alternativa (é por isso que ela sempre aparece
        // junto, não só quando a câmera falha).
      });

    return () => {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [active, elementId]);

  return <div id={elementId} className="mx-auto w-full max-w-xs" />;
}

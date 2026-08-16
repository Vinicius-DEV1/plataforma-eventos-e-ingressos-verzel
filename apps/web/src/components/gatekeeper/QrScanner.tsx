import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useId, useRef } from 'react';

// Decodes entirely in the browser via getUserMedia (DECISIONS.md — Leitura
// de QR): only the resulting text (the ticket JWT) ever reaches the
// backend, no image is uploaded anywhere.
//
// A câmera só liga quando este componente é montado, e isso só acontece
// depois de um clique explícito em "Escanear QR Code" — pedir permissão de
// câmera sem uma ação do usuário é um padrão ruim, e o navegador pode até
// ignorar o pedido por não vir de um gesto do usuário.
export function QrScanner({ onScan }: { onScan: (code: string) => void }) {
  const elementId = useId().replace(/:/g, '');
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
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
        // disponível como alternativa.
      });

    return () => {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [elementId]);

  return <div id={elementId} className="mx-auto w-full max-w-xs" />;
}

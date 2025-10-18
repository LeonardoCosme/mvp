'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type Props = Readonly<{
  onScan: (decodedText: string) => void;
  onError?: (err: string) => void;
  /** width x height do preview */
  width?: number;
  height?: number;
  className?: string;
}>;

export default function QrScanner({
  onScan,
  onError,
  width = 320,
  height = 240,
  className = '',
}: Props) {
  const containerId = useRef(`qr-${Math.random().toString(36).slice(2)}`);
  const qr = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const elId = containerId.current;

    const start = async () => {
      try {
        qr.current = new Html5Qrcode(elId);
        const cameras = await Html5Qrcode.getCameras();
        const cameraId = cameras?.[0]?.id;
        if (!cameraId) throw new Error('Câmera não encontrada.');
        await qr.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: {
              width: Math.min(250, width - 20),
              height: Math.min(250, height - 20),
            },
          },
          (decodedText) => onScan(decodedText),
          () => {}
        );
      } catch (e: any) {
        onError?.(e?.message || 'Erro ao iniciar leitor');
      }
    };

    start();

    return () => {
      if (qr.current?.isScanning) {
        qr.current.stop().finally(() => qr.current?.clear());
      } else {
        qr.current?.clear();
      }
    };
  }, [onScan, onError, width, height]);

  return (
    <div
      id={containerId.current}
      className={`rounded-xl overflow-hidden shadow bg-black/5 ${className}`}
      style={{ width, height }}
    />
  );
}

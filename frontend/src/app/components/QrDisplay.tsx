'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

type Props = Readonly<{
  text: string;
  size?: number;
  colorDark?: string;
  colorLight?: string;
  className?: string;
  alt?: string; // 👈 adicionar
}>;

export default function QrDisplay({
  text,
  size = 256,
  colorDark = '#000000',
  colorLight = '#ffffff',
  className,
  alt, // 👈 adicionar
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const url = await QRCode.toDataURL(text, {
          width: size,
          color: { dark: colorDark, light: colorLight },
          margin: 2,
        });
        if (isMounted && imgRef.current) {
          imgRef.current.src = url;
        }
      } catch {
        // silencia (pode logar se quiser)
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [text, size, colorDark, colorLight]);

  return (
    <img
      ref={imgRef}
      width={size}
      height={size}
      alt={alt ?? 'QR code'}   // 👈 usar alt
      className={className}
      decoding="async"
      loading="lazy"
    />
  );
}

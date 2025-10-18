declare module 'html5-qrcode' {
  export class Html5Qrcode {
    constructor(elementId: string);

    start(
      cameraId: string,
      config: Record<string, any>,
      onSuccess: (decodedText: string, decodedResult?: unknown) => void,
      onError?: (errorMessage: string) => void
    ): Promise<void>;

    stop(): Promise<void>;
    clear(): void;
    isScanning?: boolean;

    static getCameras(): Promise<Array<{ id: string; label: string }>>;
  }
}

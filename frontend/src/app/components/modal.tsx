'use client';

type ModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}>;

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-md',
}: ModalProps) {
  if (!open) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      aria-modal="true"
    >
      {/* Backdrop clicável e acessível (é um botão) */}
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="absolute inset-0 w-full h-full"
      />

      {/* Conteúdo do modal — sem onClick em elemento não interativo */}
      <section
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative bg-white rounded-2xl shadow-xl w-[92vw] ${maxWidthClass} p-6`}
      >
        {title && (
          <h3 id="modal-title" className="text-lg font-semibold text-[#8F1D14] mb-4">
            {title}
          </h3>
        )}

        {children}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
      </section>
    </dialog>
  );
}

import { Toaster, toast } from 'sonner';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ShowToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  description?: string;
}

export const showToast = ({ message, type = 'info', duration = 3000, description }: ShowToastOptions) => {
  const toastConfig = {
    duration,
    description,
    className: getToastClassName(type),
  };

  switch (type) {
    case 'success':
      toast.success(message, toastConfig);
      break;
    case 'error':
      toast.error(message, toastConfig);
      break;
    case 'warning':
      toast.warning(message, toastConfig);
      break;
    case 'info':
    default:
      toast.info(message, toastConfig);
  }
};

const getToastClassName = (type: ToastType): string => {
  const baseClasses = 'rounded-xl p-4 shadow-lg border backdrop-blur-sm relative overflow-hidden';

  switch (type) {
    case 'success':
      return `${baseClasses} bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/90 dark:to-green-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 [&_.toast-progress]:bg-emerald-500`;
    case 'error':
      return `${baseClasses} bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/90 dark:to-rose-950/90 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 [&_.toast-progress]:bg-red-500`;
    case 'warning':
      return `${baseClasses} bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/90 dark:to-yellow-950/90 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 [&_.toast-progress]:bg-amber-500`;
    case 'info':
    default:
      return `${baseClasses} bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/90 dark:to-cyan-950/90 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 [&_.toast-progress]:bg-blue-500`;
  }
};

export const ToastProvider = () => {
  return (
    <>
      <Toaster
        duration={3000}
        position="top-right"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'w-full flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-sm relative overflow-hidden',
            title: 'font-semibold text-sm',
            description: 'text-sm opacity-90 mt-1',
            actionButton: 'px-3 py-1.5 rounded-lg font-medium text-sm bg-white/20 hover:bg-white/30 transition-colors',
            cancelButton: 'px-3 py-1.5 rounded-lg font-medium text-sm bg-black/10 hover:bg-black/20 transition-colors',
            closeButton: 'bg-white/20 hover:bg-white/30 border-0 rounded-lg transition-colors',
            success:
              'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/90 dark:to-green-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 [&_.toast-progress]:bg-emerald-500',
            error:
              'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/90 dark:to-rose-950/90 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 [&_.toast-progress]:bg-red-500',
            warning:
              'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/90 dark:to-yellow-950/90 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 [&_.toast-progress]:bg-amber-500',
            info: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/90 dark:to-cyan-950/90 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100 [&_.toast-progress]:bg-blue-500',
          },
        }}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        [data-sonner-toast] {
          position: relative;
        }

        [data-sonner-toast]::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: currentColor;
          opacity: 0.3;
          transform-origin: left;
          animation: toast-progress var(--duration, 3000ms) linear forwards;
        }

        [data-sonner-toast][data-type="success"]::after {
          background: rgb(16 185 129);
        }

        [data-sonner-toast][data-type="error"]::after {
          background: rgb(239 68 68);
        }

        [data-sonner-toast][data-type="warning"]::after {
          background: rgb(245 158 11);
        }

        [data-sonner-toast][data-type="info"]::after {
          background: rgb(59 130 246);
        }

        @keyframes toast-progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }

        [data-sonner-toast]:hover::after {
          animation-play-state: paused;
        }
      `,
        }}
      />
    </>
  );
};

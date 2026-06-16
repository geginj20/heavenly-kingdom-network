import { X, CheckCircle, Info, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  type: "success" | "info" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
  };

  const borderColors = {
    success: "border-l-green-500",
    info: "border-l-blue-500",
    error: "border-l-red-500",
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: -20, x: 20 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-4 right-4 z-[10000] bg-white rounded-lg shadow-lg border-l-4 ${borderColors[type]} px-4 py-3 flex items-center gap-3 min-w-[300px]`}
      >
        {icons[type]}
        <p className="text-sm text-[#0c1b33] flex-1">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
          <X className="w-4 h-4 text-[#6b7c93]" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

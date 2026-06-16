import { createContext, useContext } from "react";

interface ToastContextType {
  showToast: (message: string, type?: "success" | "info" | "error") => void;
}

export const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon || <Inbox className="w-12 h-12 text-[#6b7c93] mb-4" />}
      <h3 className="font-display text-xl font-semibold text-[#0c1b33] mb-2">{title}</h3>
      {description && <p className="text-sm text-[#6b7c93] max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

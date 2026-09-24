
import React from 'react';
import { UserProfile } from '../../types';

interface AdminDiagnosticProps {
  user: UserProfile | null;
}

export const AdminDiagnostic: React.FC<AdminDiagnosticProps> = ({ user }) => {
  // Não expor UID/email em produção (info-leak em screensharing/inspeção)
  if (import.meta.env.PROD) return null;
  return (
    <div className="hidden sm:block fixed top-24 right-2 z-[9999] bg-black/80 text-[8px] text-white p-2 rounded-lg font-mono opacity-50 hover:opacity-100 transition-opacity max-w-[180px] truncate">
      ADMIN_UID: {user?.id}<br />
      ADMIN_EMAIL: {user?.email}
    </div>
  );
};

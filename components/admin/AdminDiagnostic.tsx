
import React from 'react';
import { UserProfile } from '../../types';

interface AdminDiagnosticProps {
  user: UserProfile | null;
}

export const AdminDiagnostic: React.FC<AdminDiagnosticProps> = ({ user }) => {
  return (
    <div className="fixed top-24 right-4 z-[9999] bg-black/80 text-[8px] text-white p-2 rounded-lg font-mono opacity-50 hover:opacity-100 transition-opacity">
      ADMIN_UID: {user?.id}<br />
      ADMIN_ROLE: {user?.role}
    </div>
  );
};

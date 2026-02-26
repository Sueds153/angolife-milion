
import React from 'react';
import { UserProfile } from '../../types';

interface AdminDiagnosticProps {
  user: UserProfile | null;
}

export const AdminDiagnostic: React.FC<AdminDiagnosticProps> = ({ user }) => {
  return (
    <div className="fixed bottom-20 left-4 z-[9999] bg-black/80 text-[8px] text-white p-2 rounded-lg font-mono">
      ADMIN_UID: {user?.id}<br />
      ADMIN_ROLE: {user?.role}
    </div>
  );
};

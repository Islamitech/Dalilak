import React, { useState } from 'react';
import { UserRole } from '../types';

interface UserAvatarProps {
  avatar?: string;
  name: string;
  role?: UserRole;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  avatarStatus?: 'none' | 'pending_approval' | 'approved' | 'rejected';
  isAdminPreview?: boolean;
}

/**
 * Extracts the single first character of the user's name cleanly
 */
export function getArabicInitial(name: string): string {
  if (!name) return 'م';
  const cleanName = name.replace(/^(م\.|أستاذة|د\.|أستاذ)\s+/i, '').trim();
  return cleanName.charAt(0) || name.charAt(0) || 'م';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name,
  role = 'rep',
  size = 'md',
  className = '',
  avatarStatus = 'approved',
  isAdminPreview = false,
}) => {
  const [imageError, setImageError] = useState<boolean>(false);

  const dimensions = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  }[size];

  const fontSizes = {
    sm: 'text-sm font-extrabold',
    md: 'text-lg font-black',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black',
  }[size];

  const roleColors = {
    admin: 'from-amber-500 via-amber-600 to-yellow-600 border-amber-300 text-slate-950 shadow-amber-500/20',
    supervisor: 'from-purple-600 via-purple-700 to-indigo-700 border-purple-400 text-white shadow-purple-500/20',
    accountant: 'from-emerald-600 via-teal-600 to-emerald-700 border-emerald-400 text-white shadow-emerald-500/20',
    rep: 'from-blue-600 via-blue-700 to-indigo-700 border-blue-400 text-white shadow-blue-500/20',
  }[role];

  // Check valid image URL
  const isValidImageUrl =
    avatar &&
    avatar.trim().length > 5 &&
    (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:image/'));

  const isPending = avatarStatus === 'pending_approval';

  // Render Image Avatar (If approved OR if pending for Admin preview / faded for user)
  if (isValidImageUrl && !imageError && avatarStatus !== 'rejected') {
    // If pending approval and NOT admin preview, show as faded/muted image with 'Under Review' overlay
    const imgClasses = isPending && !isAdminPreview
      ? 'w-full h-full object-cover opacity-40 grayscale blur-[1.5px]'
      : 'w-full h-full object-cover';

    return (
      <div className={`relative ${dimensions} rounded-2xl overflow-hidden border-2 ${isPending ? 'border-amber-500/80 shadow-amber-500/20' : 'border-amber-500/50'} shadow-md ${className}`}>
        <img
          src={avatar}
          alt={name}
          onError={() => setImageError(true)}
          className={imgClasses}
        />
        {isPending && (
          <span className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] flex items-center justify-center text-[9px] font-black text-amber-300 text-center p-0.5 leading-tight">
            🔒 قيد المراجعة
          </span>
        )}
      </div>
    );
  }

  // Display First Letter of User Name as Avatar Image Icon
  const initialLetter = getArabicInitial(name);

  return (
    <div
      className={`relative ${dimensions} rounded-2xl bg-gradient-to-br ${roleColors} border-2 shadow-lg flex items-center justify-center font-black select-none ${className}`}
      title={name}
    >
      <span className={`${fontSizes} font-['Cairo'] leading-none drop-shadow-sm`}>
        {initialLetter}
      </span>
      {isPending && (
        <span className="absolute inset-0 rounded-2xl bg-slate-950/80 backdrop-blur-[1px] flex items-center justify-center text-[9px] font-black text-amber-300 text-center p-0.5 leading-tight">
          🔒 قيد المراجعة
        </span>
      )}
    </div>
  );
};

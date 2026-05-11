import React from 'react';

const avatarMap: { [key: string]: string } = {
  'DW': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
  'MG': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  'JC': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  'PL': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
  'RK': 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=150&h=150&fit=crop',
  'DP': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
  'JT': 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop',
  'EM': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
  'NA': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
  'LS': 'https://images.unsplash.com/photo-1531123897727-8f129e1bfa82?w=150&h=150&fit=crop',
  'MT': 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop',
  'AD': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  'DS': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
};

interface AvatarProps {
  initials: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  online?: boolean;
  className?: string;
  shape?: 'circle' | 'square';
}

export const Avatar: React.FC<AvatarProps> = ({ initials, src, size = 'md', online = false, className = '', shape = 'circle' }) => {
  const sizes: { [key in NonNullable<AvatarProps['size']>]: string } = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    full: 'w-full h-full',
  };

  const imageSrc = src || avatarMap[initials];
  const roundedClass = shape === 'square' ? 'rounded-[inherit]' : 'rounded-full';

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {imageSrc ? (
        <img src={imageSrc} alt={initials} className={`${sizes[size]} ${roundedClass} object-cover shadow-sm ring-1 ring-black/5`} />
      ) : (
        <div className={`${sizes[size]} ${roundedClass} bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold tracking-normal shadow-sm`}>
          {initials}
        </div>
      )}
      {online && (
        <span className={`absolute bottom-0 right-0 ${size === 'full' ? 'w-4 h-4' : 'w-[28%] h-[28%]'} bg-emerald-500 border-2 border-white rounded-full`}></span>
      )}
    </div>
  );
};

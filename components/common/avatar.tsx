"use client"

import Image from 'next/image';
import React from 'react';

interface AvatarProps {
  displayName: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  displayName, 
  imageUrl, 
  size = 'md', 
  className = '' 
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  return (
    <div className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold ${sizeClasses[size]} ${className}`}>
      {imageUrl ? (
        <Image
            width={300} 
            height={300} 
            src={imageUrl} 
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span>{getInitials(displayName)}</span>
      )}
    </div>
  );
};

export default Avatar;
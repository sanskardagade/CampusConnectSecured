import React from 'react';
import { useIsMobile } from '../hooks/use-mobile';

const HeaderMobile = ({ title }) => {
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-red-900 text-white flex items-center justify-center px-4 py-3 shadow-md">
      <span className="text-xl font-bold tracking-wide">{title}</span>
    </header>
  );
};

export default HeaderMobile; 
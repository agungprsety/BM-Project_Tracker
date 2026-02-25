import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  darkMode?: boolean;
}

export default function Card({ children, className = '', darkMode = false }: CardProps) {
  return (
    <div className={`rounded-xl shadow-lg p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} ${className}`}>
      {children}
    </div>
  );
}

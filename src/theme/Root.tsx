import React from 'react';
import FloatingChatWidget from '../components/FloatingChatWidget';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FloatingChatWidget />
    </>
  );
}
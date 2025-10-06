import React, { createContext, useState } from 'react';

export const TranscriptionContext = createContext();

export const TranscriptionProvider = ({ children }) => {
  const [transcription, setTranscription] = useState('');
  const [isActive, setIsActive] = useState(false);

  return (
    <TranscriptionContext.Provider value={{ 
      transcription, 
      setTranscription,
      isActive,
      setIsActive 
    }}>
      {children}
    </TranscriptionContext.Provider>
  );
};
import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface SmartDateInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

export const testRegex = () => {
    return true;
}

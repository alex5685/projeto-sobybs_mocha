"use client";

import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CurrencyInput({ value, onChange, placeholder, disabled, className }: CurrencyInputProps) {
  const formatCurrency = (val: string): string => {
    // Remove tudo exceto números
    const numbers = val.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Converte para número e formata
    const amount = parseFloat(numbers) / 100;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    onChange(formatted);
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder || "R$ 0,00"}
      disabled={disabled}
      className={className}
    />
  );
}

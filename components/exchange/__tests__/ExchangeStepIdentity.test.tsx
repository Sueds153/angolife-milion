import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExchangeStepIdentity } from '../ExchangeStepIdentity';
import React from 'react';

describe('ExchangeStepIdentity', () => {
  const mockFormData = {
    fullName: 'Test User',
    age: '25',
    gender: 'Masculino',
    wallet: 'Binance',
    coordinates: '123456',
    bank: 'BAI',
    iban: '',
    accountHolder: ''
  };

  const mockProps = {
    tradeAction: 'buy' as const,
    tradeAmount: '100',
    tradeCurrency: 'USD' as const,
    totalKzFormatted: '100.000,00 Kz',
    currentRateValue: 1000,
    isRateValid: true,
    formData: mockFormData,
    setFormData: vi.fn(),
    showStep1Errors: false,
    savingsFormatted: '5.000,00 Kz'
  };

  it('renders the component with correct information', () => {
    // @ts-ignore - Ignore props types for simple test
    render(<ExchangeStepIdentity {...mockProps} />);
    
    expect(screen.getByText(/Passo 1: Identificação/i)).toBeInTheDocument();
    expect(screen.getByText('100.000,00 Kz')).toBeInTheDocument();
    expect(screen.getByText('100.00 USD')).toBeInTheDocument();
  });

  it('shows error messages when showStep1Errors is true', () => {
    const propsWithErrors = {
      ...mockProps,
      showStep1Errors: true,
      formData: { ...mockFormData, fullName: '' }
    };
    
    // @ts-ignore
    render(<ExchangeStepIdentity {...propsWithErrors} />);
    
    expect(screen.getByText(/Campo obrigatório/i)).toBeInTheDocument();
  });
});

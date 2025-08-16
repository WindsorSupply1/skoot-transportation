'use client';

import { useState, useEffect } from 'react';
import { Loader2, CreditCard, Shield, CheckCircle } from 'lucide-react';

interface LoadingModalProps {
  isVisible: boolean;
  stage: 'processing' | 'payment' | 'confirmation' | 'booking';
  message?: string;
}

export function LoadingModal({ isVisible, stage, message }: LoadingModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 'processing', label: 'Processing request...', icon: Loader2 },
    { id: 'payment', label: 'Securing payment...', icon: CreditCard },
    { id: 'booking', label: 'Creating booking...', icon: Shield },
    { id: 'confirmation', label: 'Confirming details...', icon: CheckCircle },
  ];

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setCurrentStep(0);
      return;
    }

    const stageIndex = steps.findIndex(step => step.id === stage);
    setCurrentStep(stageIndex);

    // Simulate progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 10;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isVisible, stage]);

  if (!isVisible) return null;

  const CurrentIcon = steps[currentStep]?.icon || Loader2;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center">
        {/* Animated Icon */}
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CurrentIcon className="w-8 h-8 text-orange-600 animate-spin" />
        </div>

        {/* Main Message */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {message || steps[currentStep]?.label || 'Processing...'}
        </h3>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-orange-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                  isCompleted ? 'bg-green-500 text-white' :
                  isActive ? 'bg-orange-500 text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Icon className={`w-3 h-3 ${isActive ? 'animate-spin' : ''}`} />
                  )}
                </div>
                <span className={`text-xs ${
                  isActive ? 'text-orange-600' : 
                  isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {step.id.charAt(0).toUpperCase() + step.id.slice(1)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Security Note */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Shield className="w-3 h-3" />
            <span className="font-medium">Secure Processing</span>
          </div>
          <p>Your payment information is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}

interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

export function SkeletonLoader({ lines = 3, className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          } ${lines === 1 ? 'h-6' : 'h-4'} ${index > 0 ? 'mt-3' : ''}`}
        />
      ))}
    </div>
  );
}

interface InlineLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'orange' | 'blue' | 'green' | 'gray';
  text?: string;
}

export function InlineLoading({ 
  size = 'md', 
  color = 'orange', 
  text 
}: InlineLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const colorClasses = {
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    gray: 'text-gray-600'
  };

  return (
    <div className="flex items-center space-x-2">
      <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`} />
      {text && (
        <span className={`text-sm ${colorClasses[color]}`}>
          {text}
        </span>
      )}
    </div>
  );
}

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export function ButtonWithLoading({
  isLoading,
  children,
  className = '',
  disabled,
  onClick,
  type = 'button'
}: ButtonLoadingProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative transition-colors ${className} ${
        isLoading || disabled ? 'opacity-75 cursor-not-allowed' : ''
      }`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
      <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
}
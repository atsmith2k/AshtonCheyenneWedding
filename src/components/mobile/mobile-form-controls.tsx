'use client'

import { forwardRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ label, error, helperText, required, className, type = 'text', ...props }, ref) => {
    const { isMobile, isTouchDevice } = useMobileDetection()
    
    // Optimize input types for mobile keyboards
    const getInputMode = (type: string) => {
      switch (type) {
        case 'email':
          return 'email'
        case 'tel':
          return 'tel'
        case 'number':
          return 'numeric'
        case 'url':
          return 'url'
        default:
          return 'text'
      }
    }

    const getAutoComplete = (type: string, name?: string) => {
      if (name?.includes('email')) return 'email'
      if (name?.includes('phone') || name?.includes('tel')) return 'tel'
      if (name?.includes('name')) return 'name'
      if (type === 'email') return 'email'
      if (type === 'tel') return 'tel'
      return 'off'
    }

    return (
      <div className="space-y-2">
        {label && (
          <Label className={cn(
            'text-sm font-medium',
            isMobile && 'text-base',
            error && 'text-destructive'
          )}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <Input
          ref={ref}
          type={type}
          inputMode={getInputMode(type)}
          autoComplete={getAutoComplete(type, props.name)}
          className={cn(
            'transition-all duration-200',
            isTouchDevice && 'min-h-[48px] text-base', // Prevent zoom on iOS
            error && 'border-destructive focus:border-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <X className="w-4 h-4" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)
MobileInput.displayName = 'MobileInput'

interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ label, error, helperText, required, className, ...props }, ref) => {
    const { isMobile, isTouchDevice } = useMobileDetection()

    return (
      <div className="space-y-2">
        {label && (
          <Label className={cn(
            'text-sm font-medium',
            isMobile && 'text-base',
            error && 'text-destructive'
          )}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <Textarea
          ref={ref}
          className={cn(
            'transition-all duration-200 resize-none',
            isTouchDevice && 'min-h-[120px] text-base',
            error && 'border-destructive focus:border-destructive',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <X className="w-4 h-4" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)
MobileTextarea.displayName = 'MobileTextarea'

interface MobileSelectProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function MobileSelect({
  label,
  error,
  helperText,
  required,
  placeholder,
  value,
  onValueChange,
  children,
  className
}: MobileSelectProps) {
  const { isMobile, isTouchDevice } = useMobileDetection()

  return (
    <div className="space-y-2">
      {label && (
        <Label className={cn(
          'text-sm font-medium',
          isMobile && 'text-base',
          error && 'text-destructive'
        )}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(
          'transition-all duration-200',
          isTouchDevice && 'min-h-[48px] text-base',
          error && 'border-destructive focus:border-destructive',
          className
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  )
}

interface MobileRadioGroupProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  value?: string
  onValueChange?: (value: string) => void
  options: Array<{ value: string; label: string; description?: string }>
  className?: string
}

export function MobileRadioGroup({
  label,
  error,
  helperText,
  required,
  value,
  onValueChange,
  options,
  className
}: MobileRadioGroupProps) {
  const { isMobile, isTouchDevice } = useMobileDetection()

  return (
    <div className="space-y-3">
      {label && (
        <Label className={cn(
          'text-sm font-medium',
          isMobile && 'text-base',
          error && 'text-destructive'
        )}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <RadioGroup value={value} onValueChange={onValueChange} className={className}>
        {options.map((option) => (
          <div key={option.value} className={cn(
            'flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200',
            'hover:bg-accent hover:border-accent-foreground/20',
            isTouchDevice && 'min-h-[56px]',
            value === option.value && 'bg-primary/5 border-primary'
          )}>
            <RadioGroupItem 
              value={option.value} 
              id={option.value}
              className={cn(
                'mt-0.5',
                isTouchDevice && 'w-5 h-5'
              )}
            />
            <div className="flex-1">
              <Label 
                htmlFor={option.value}
                className={cn(
                  'font-medium cursor-pointer',
                  isMobile && 'text-base'
                )}
              >
                {option.label}
              </Label>
              {option.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {option.description}
                </p>
              )}
            </div>
            {value === option.value && (
              <Check className="w-5 h-5 text-primary mt-0.5" />
            )}
          </div>
        ))}
      </RadioGroup>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  )
}

interface MobileCheckboxProps {
  label: string
  description?: string
  error?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  required?: boolean
  className?: string
}

export function MobileCheckbox({
  label,
  description,
  error,
  checked,
  onCheckedChange,
  required,
  className
}: MobileCheckboxProps) {
  const { isMobile, isTouchDevice } = useMobileDetection()

  return (
    <div className="space-y-2">
      <div className={cn(
        'flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200',
        'hover:bg-accent hover:border-accent-foreground/20',
        isTouchDevice && 'min-h-[56px]',
        checked && 'bg-primary/5 border-primary',
        error && 'border-destructive',
        className
      )}>
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className={cn(
            'mt-0.5',
            isTouchDevice && 'w-5 h-5'
          )}
        />
        <div className="flex-1">
          <Label className={cn(
            'font-medium cursor-pointer',
            isMobile && 'text-base',
            error && 'text-destructive'
          )}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        {checked && (
          <Check className="w-5 h-5 text-primary mt-0.5" />
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  )
}

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  describe('Basic Functionality', () => {
    it('merges single class name', () => {
      const result = cn('text-red-500');
      expect(result).toBe('text-red-500');
    });

    it('merges multiple class names', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('handles empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('filters out falsy values', () => {
      const result = cn('text-red-500', false, 'bg-blue-500', null, undefined);
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('false');
      expect(result).not.toContain('null');
    });
  });

  describe('Conditional Classes', () => {
    it('handles conditional class names', () => {
      const isActive = true;
      const result = cn(isActive && 'active', !isActive && 'inactive');
      expect(result).toBe('active');
    });

    it('handles multiple conditional classes', () => {
      const isActive = false;
      const isDisabled = true;
      const result = cn('base-class', isActive && 'active', isDisabled && 'disabled');
      expect(result).toContain('base-class');
      expect(result).toContain('disabled');
      expect(result).not.toContain('active');
    });
  });

  describe('Tailwind Merge Behavior', () => {
    it('merges conflicting Tailwind classes (last wins)', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    it('keeps non-conflicting Tailwind classes', () => {
      const result = cn('p-4', 'm-4');
      expect(result).toContain('p-4');
      expect(result).toContain('m-4');
    });

    it('handles responsive classes', () => {
      const result = cn('text-sm', 'md:text-lg');
      expect(result).toContain('text-sm');
      expect(result).toContain('md:text-lg');
    });

    it('merges conflicting responsive classes', () => {
      const result = cn('md:p-4', 'md:p-8');
      expect(result).toBe('md:p-8');
    });
  });

  describe('Complex Scenarios', () => {
    it('handles arrays of classes', () => {
      const result = cn(['text-red-500', 'bg-blue-500']);
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('handles objects with boolean values', () => {
      const result = cn({
        'text-red-500': true,
        'bg-blue-500': false,
        'p-4': true,
      });
      expect(result).toContain('text-red-500');
      expect(result).toContain('p-4');
      expect(result).not.toContain('bg-blue-500');
    });

    it('handles mixed input types', () => {
      const result = cn(
        'base',
        ['array-1', 'array-2'],
        { 'object-1': true, 'object-2': false },
        'string-1',
      );
      expect(result).toContain('base');
      expect(result).toContain('array-1');
      expect(result).toContain('array-2');
      expect(result).toContain('object-1');
      expect(result).toContain('string-1');
      expect(result).not.toContain('object-2');
    });
  });

  describe('Practical Use Cases', () => {
    it('works with component variants', () => {
      const variant = 'primary';
      const size = 'large';
      const result = cn(
        'button',
        variant === 'primary' && 'bg-blue-500',
        variant === 'secondary' && 'bg-gray-500',
        size === 'large' && 'p-4',
        size === 'small' && 'p-2',
      );
      expect(result).toContain('button');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('p-4');
      expect(result).not.toContain('bg-gray-500');
      expect(result).not.toContain('p-2');
    });

    it('overrides default with custom classes', () => {
      const defaultClasses = 'p-4 text-sm bg-white';
      const customClasses = 'p-8 bg-blue-500';
      const result = cn(defaultClasses, customClasses);
      expect(result).toContain('p-8');
      expect(result).toContain('text-sm');
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('p-4');
      expect(result).not.toContain('bg-white');
    });

    it('handles complex component styling', () => {
      const isActive = true;
      const isDisabled = false;
      const variant = 'outline';
      const result = cn(
        'inline-flex items-center justify-center',
        'rounded-md transition-colors',
        variant === 'default' && 'bg-primary text-white',
        variant === 'outline' && 'border border-input',
        isActive && 'ring-2 ring-offset-2',
        isDisabled && 'opacity-50 pointer-events-none',
      );
      expect(result).toContain('inline-flex');
      expect(result).toContain('border');
      expect(result).toContain('border-input');
      expect(result).toContain('ring-2');
      expect(result).not.toContain('bg-primary');
      expect(result).not.toContain('opacity-50');
    });
  });

  describe('Edge Cases', () => {
    it('handles whitespace in class names', () => {
      const result = cn('  text-red-500  ', '  bg-blue-500  ');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('handles duplicate class names', () => {
      const result = cn('text-red-500', 'text-red-500');
      expect(result).toBe('text-red-500');
    });

    it('returns empty string for all falsy inputs', () => {
      const result = cn(false, null, undefined, '');
      expect(result).toBe('');
    });
  });
});

import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    className = '',
    disabled,
    style,
    ...props
}) => {
    const baseStyles = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 20px',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '0.95rem',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.6 : 1,
        border: 'none',
        gap: '8px',
    };

    const variants = {
        primary: {
            background: 'var(--primary)',
            color: 'white',
            // Removed shadow-glow as per "calm" request
        },
        secondary: {
            background: 'var(--surface)',
            color: 'var(--text-main)',
            border: '1px solid var(--border)',
        },
        danger: {
            background: 'var(--error)',
            color: 'white',
        },
        ghost: {
            background: 'transparent',
            color: 'var(--text-secondary)',
        }
    };

    return (
        <button
            className={className}
            disabled={disabled || isLoading}
            style={{ ...baseStyles, ...variants[variant], ...style }}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            {children}
        </button>
    );
};

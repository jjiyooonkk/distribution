import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
    // props에서 value와 style을 안전하게 분리합니다.
    const { value, style, ...restProps } = props;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            {label && (
                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {label}
                </label>
            )}
            <input
                // 핵심: NaN 방어 로직
                value={value === undefined || (typeof value === 'number' && Number.isNaN(value)) ? "" : value}
                className={`input-field ${className || ''}`}
                style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${error ? 'var(--error)' : 'var(--border)'}`,
                    outline: 'none',
                    backgroundColor: 'var(--background-secondary)',
                    color: 'var(--text-primary)',
                    ...style
                }}
                {...(restProps as any)}
            />
            {error && (
                <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>
                    {error}
                </span>
            )}
        </div>
    );
};
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false, style, ...props }) => {
    return (
        <div
            className={`glass-panel ${className}`}
            style={{
                padding: '24px',
                transition: hoverEffect ? 'transform 0.2s ease, box-shadow 0.2s ease' : undefined,
                cursor: hoverEffect ? 'pointer' : 'default',
                ...style
            }}
            {...props}
        >
            {children}
        </div>
    );
};

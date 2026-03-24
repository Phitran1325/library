import React from 'react';

interface BookImageProps {
    src: string;
    alt: string;
    className?: string;
}

export const BookImage: React.FC<BookImageProps> = ({ src, alt, className = '' }) => {
    return (
        <div className={`rounded-lg overflow-hidden shadow-lg ${className}`}>
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover"
            />
        </div>
    );
};
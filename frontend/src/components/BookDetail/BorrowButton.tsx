
import type { Book } from '@/types';
import { useState } from 'react';
import BorrowBookModal from './BorrowBookModal';


interface BorrowButtonProps {
    book: Book;
    onSuccess?: () => void;
}

export const BorrowButton = ({ book, onSuccess }: BorrowButtonProps) => {
    const [showModal, setShowModal] = useState(false);

    const handleClick = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để mượn sách');
            window.location.href = '/login';
            return;
        }
        setShowModal(true);
    };

    const handleError = (message: string, errors?: string[]) => {
        const errorText = errors && errors.length > 0 
            ? `${message}\n${errors.join('\n')}` 
            : message;
        alert(errorText);
    };

    const isAvailable = book.status === 'available' && (book.availableCopies || book.available || 0) > 0;

    return (
        <>
            <button
                onClick={handleClick}
                disabled={!isAvailable}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${isAvailable
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
            >
                {isAvailable ? 'Mượn sách' : 'Hết sách'}
            </button>

            <BorrowBookModal
                book={book}
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={() => {
                    setShowModal(false);
                    onSuccess?.();
                }}
                onError={handleError}
            />
        </>
    );
};

import type { Book } from '../../types';
import BookCard from './BookCard';

interface BookGridProps {
    books: Book[];
    viewMode: 'grid' | 'list';
    onBookClick: (bookId: string) => void;
}

const BookGrid = ({ books, viewMode, onBookClick }: BookGridProps) => {
    return (
        <div
            className={
                viewMode === 'grid'
                    ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
                    : 'space-y-4 '
            }
        >
            {books.map((book) => (
                <BookCard
                    key={book.id}
                    book={book}
                    viewMode={viewMode}
                    onClick={onBookClick}
                />
            ))}
        </div>
    );
};

export default BookGrid;

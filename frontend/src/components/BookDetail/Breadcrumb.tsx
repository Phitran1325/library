import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
    bookTitle?: string;
}

const BREADCRUMB_ITEMS = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Sách', path: '/books' }
] as const;

export const Breadcrumb = ({ bookTitle }: BreadcrumbProps) => {
    const navigate = useNavigate();

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-text-light mb-6">
            {BREADCRUMB_ITEMS.map((item) => (
                <div key={item.path} className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(item.path)}
                        className="hover:text-primary transition-colors"
                    >
                        {item.label}
                    </button>
                    <ChevronRight size={16} />
                </div>
            ))}
            {bookTitle && (
                <span className="text-text font-medium line-clamp-1">
                    {bookTitle}
                </span>
            )}
        </nav>
    );
};
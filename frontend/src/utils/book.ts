import type { Book } from "@/types";

export const getBookImage = (book: Book) => {
    return (
        book?.coverImage ??
        book?.image ??
        'https://placehold.co/400x550?text=No+Image'
    );
};

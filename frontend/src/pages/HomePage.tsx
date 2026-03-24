import { useState, useEffect } from 'react';
import type { Book } from '../types/index';
import { getHotBooks, getNewReleaseBooks } from '../services/store.api';
import MainBanner from '@/components/HomePage/MainBanner';
import SideInfo from '@/components/HomePage/SideInfo';
import LibraryStats from '@/components/HomePage/LibraryStats';
import PopularBooks from '@/components/HomePage/PopularBook';
import NewArrivals from '@/components/HomePage/NewArrivals';
import QuickNavigation from '@/components/HomePage/QuickNavigation';
import LibraryFeatures from '@/components/HomePage/LibraryFeatures';
import CallToAction from '@/components/HomePage/CallToAction';
import ErrorNoti from '@/components/HomePage/ErrorNoti';

const HomePage = () => {
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [newBooks, setNewBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch data khi component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setHasError(false);
        setErrorMessage('');

        // Fetch books đồng thời (không fetch banners nữa vì đã hardcoded)
        const [hotBooksData, newBooksData] = await Promise.all([
          getHotBooks(10).catch(() => []), // Lấy 10 sách phổ biến
          getNewReleaseBooks(5).catch(() => []) // Lấy 5 sách mới
        ]);

        setPopularBooks(hotBooksData);
        setNewBooks(newBooksData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setHasError(true);
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Không thể kết nối đến server. Vui lòng thử lại sau.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-light text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Error notification - hiện ở góc trên nếu có lỗi */}
      {hasError && (
        <ErrorNoti errorMessage={errorMessage} />
      )}

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto p-8">
        {/* Banner Carousel */}
        <div className="mb-8">
          <div className="flex gap-4">
            {/* Main Banner - Không cần truyền props */}
            <div className="flex-2 relative bg-linear-to-r from-primary-light/20 to-primary/20 rounded-lg overflow-hidden min-h-[350px] flex items-center justify-center shadow-md">
              <MainBanner />
            </div>

            {/* Side Info Cards */}
            <SideInfo />
          </div>
        </div>

        {/* Library Stats */}
        <LibraryStats />

        {/* Popular Books */}
        <PopularBooks books={popularBooks} hasError={hasError} />

        {/* New Arrivals */}
        <NewArrivals newBooks={newBooks} hasError={hasError} />

        {/* Quick Navigation */}
        <QuickNavigation />

        {/* Library Features */}
        <LibraryFeatures />

        {/* Call to Action */}
        <CallToAction />
      </main>
    </div>
  );
};

export default HomePage;
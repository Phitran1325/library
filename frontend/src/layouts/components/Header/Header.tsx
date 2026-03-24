import { Menu, Search, ShoppingCart, User, LogOut, Package, Bookmark, CreditCard, Settings, LibraryBig } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { FiBookOpen } from 'react-icons/fi';
import { APP_NAME } from '../../../constants';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaRegHeart } from "react-icons/fa";
import NotificationDropdown from '../NotificationDropdown';
import { bookService } from '@/services/book.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { Book } from '@/types';
import useNotification from '@/hooks/userNotification';
import { ChevronDown } from 'lucide-react';
import { X } from 'lucide-react';
import { Role } from '@/types';
import ConfirmModal from '@/components/common/book/ConfirmModal';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileUserMenu, setShowMobileUserMenu] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { showError } = useNotification();

  const { user, isAuthenticated, logout, userRole } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // ✅ FIX: Không đóng dropdown nếu click vào book item
      const target = event.target as HTMLElement;

      // Check if clicked inside a book item (có class hover:bg-gray-50)
      const isBookItem = target.closest('.cursor-pointer');
      if (isBookItem && showSearchResults) {
        console.log('🎯 [handleClickOutside] Clicked on book item, not closing dropdown');
        return; // Không đóng dropdown, để handleBookClick xử lý
      }

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
        setShowMobileUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    if (showUserMenu || showMobileMenu || showSearchResults) {
      // ✅ FIX: Dùng mouseup thay vì mousedown để onClick có cơ hội chạy trước
      document.addEventListener('mouseup', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
    };
  }, [showUserMenu, showMobileMenu, showSearchResults]);

  // Search books when debounced query changes
  useEffect(() => {
    const searchBooks = async () => {
      if (debouncedSearchQuery.trim().length === 0) {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const results = await bookService.getBooks({
          title: debouncedSearchQuery.trim(),
          page: 1,
          limit: 5, // Chỉ hiển thị 5 kết quả trong dropdown
        });
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Detect typing
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    }

    searchBooks();
  }, [debouncedSearchQuery, searchQuery]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    setShowUserMenu(false);
    setShowMobileMenu(false);
    setShowMobileUserMenu(false);
    navigate('/login');
  };

  const handleUserClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu);
    } else {
      navigate('/login');
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setShowMobileMenu(false);
    setShowMobileUserMenu(false);
  };

  const handleBookClick = (book: Book) => {
    console.log('🔍 [handleBookClick] Called with book:', {
      title: book.title,
      slug: book.slug,
      _id: book._id,
      id: book.id
    });

    // ✅ Ưu tiên slug (SEO friendly) > _id > id
    const bookIdentifier = book.slug || book._id || book.id;
    console.log('📍 [handleBookClick] Using identifier:', bookIdentifier);

    if (!bookIdentifier) {
      console.error('❌ Book identifier not found for book:', book.title);
      showError('Không tìm thấy thông tin sách', 'Lỗi');
      return;
    }

    // ✅ Clear search và đóng dropdown TRƯỚC KHI navigate
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]); // Clear results luôn

    // Navigate đến trang chi tiết sách
    const targetPath = `/books/${bookIdentifier}`;
    console.log('🚀 [handleBookClick] Navigating to:', targetPath);

    // ✅ Đảm bảo dropdown đã đóng trước khi navigate
    setTimeout(() => {
      navigate(targetPath);
    }, 0);
  };

  const handleViewAllResults = () => {
    const query = searchQuery.trim();
    console.log('📋 [handleViewAllResults] Navigating with query:', query);

    setShowSearchResults(false);
    setSearchQuery('');

    // Navigate với query parameter
    navigate(`/books?search=${encodeURIComponent(query)}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return (
    <div className="bg-primary text-white shadow-md">
      {/* Main Header */}
      <div className="max-w-[1400px] mx-auto p-4 flex items-center justify-between gap-4">
        {/* Left: Logo + Category (Desktop) */}
        <div className="flex items-center gap-4 lg:gap-8">
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <FiBookOpen size={24} className="lg:w-[30px] lg:h-[30px]" />
            <h1 className="text-2xl lg:text-4xl text-white font-bold">{APP_NAME}</h1>
          </div>

          {/* Role-based navigation buttons */}
          {isAuthenticated && userRole === Role.LIBRARIAN && (
            <button
              onClick={() => navigate('/librarian')}
              className="hidden lg:flex bg-white/10 hover:bg-white/20 border-none text-white items-center gap-2 cursor-pointer text-base px-4 py-2 rounded-lg transition-all hover:scale-105"
            >
              <LibraryBig size={20} />
              <span>Quản Lý Thư Viện</span>
            </button>
          )}

          {isAuthenticated && userRole === Role.ADMIN && (
            <button
              onClick={() => navigate('/admin')}
              className="hidden lg:flex bg-white/10 hover:bg-white/20 border-none text-white items-center gap-2 cursor-pointer text-base px-4 py-2 rounded-lg transition-all hover:scale-105"
            >
              <Settings size={20} />
              <span>Quản Trị Hệ Thống</span>
            </button>
          )}
        </div>

        {/* Center: Search (Desktop) */}
        <div ref={searchRef} className="hidden lg:block w-full max-w-[400px] relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light z-10"
            size={20}
          />
          <input
            type="text"
            placeholder="Tìm Sách"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowSearchResults(true);
              }
            }}
            className="w-full p-2 pl-10 pr-10 rounded-md border-none outline-none text-sm text-text"
          />

          {/* Clear & Loading */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery && !isSearching && (
              <button
                onClick={handleClearSearch}
                className="hover:bg-gray-200 rounded-full p-1 transition-colors"
              >
                <X size={16} className="text-text-light" />
              </button>
            )}
            {isSearching && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full mt-3 w-full bg-white rounded-xl shadow-2xl border border-gray-100 max-h-[450px] overflow-hidden z-50 pointer-events-auto">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Kết quả tìm kiếm</p>
              </div>

              {/* Scrollable container for book items */}
              <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {searchResults.map((book, index) => (
                  <div
                    key={book._id || book.id}
                    onClick={(e) => {
                      console.log('🖱️ [Desktop] Book item clicked:', book.title);
                      e.preventDefault();
                      e.stopPropagation();
                      handleBookClick(book);
                    }}
                    className={`flex items-center gap-4 p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent cursor-pointer transition-all duration-200 group ${index !== searchResults.length - 1 ? 'border-b border-gray-100' : ''
                      }`}
                  >
                    {/* Book Image with shadow */}
                    <div className="w-14 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0 overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                      {(book.coverImage || book.image) ? (
                        <img
                          src={book.coverImage || book.image}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <FiBookOpen size={26} />
                        </div>
                      )}
                    </div>

                    {/* Book Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">
                        {book.title}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        <span className="font-medium">Tác giả:</span> {book.authorId?.name || 'Không rõ'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {(book.availableCopies ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Còn {book.availableCopies ?? 0} cuốn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            Hết sách
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View All Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewAllResults();
                }}
                className="w-full p-4 text-sm text-white font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-200 border-t border-gray-200 flex items-center justify-center gap-2 group"
              >
                <Search size={16} className="group-hover:scale-110 transition-transform" />
                Xem tất cả kết quả cho "{searchQuery}"
              </button>
            </div>
          )}

          {/* No Results */}
          {showSearchResults && searchResults.length === 0 && !isSearching && searchQuery.trim() && (
            <div className="absolute top-full mt-3 w-full bg-white rounded-xl shadow-2xl border border-gray-100 p-6 z-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search size={28} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Không tìm thấy kết quả
                </p>
                <p className="text-xs text-gray-500">
                  Không có sách nào khớp với "{searchQuery}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex gap-4 lg:gap-8 items-center">
          {/* Notification - Desktop & Mobile */}
          {isAuthenticated && (
            <div className="lg:block">
              <NotificationDropdown />
            </div>
          )}

          {/* My Borrows - Desktop */}
          <button
            onClick={() => navigate('/my-borrows')}
            className="hidden lg:flex bg-transparent border-none text-white cursor-pointer flex-col items-center gap-1 hover:scale-105 transition-transform"
          >
            <ShoppingCart size={24} />
            <span className="text-sm">Danh Sách Mượn</span>
          </button>

          {/* User Account - Desktop */}
          <div className="hidden lg:block relative" ref={menuRef}>
            <button
              onClick={handleUserClick}
              className="bg-transparent border-none text-white cursor-pointer flex flex-col items-center gap-1 hover:scale-105 transition-transform"
            >
              <User size={24} />
              <span className="text-sm max-w-[100px] truncate">
                {isAuthenticated && user ? user.fullName : 'Tài Khoản'}
              </span>
            </button>

            {/* User Dropdown Menu */}
            {isAuthenticated && (
              <div
                className={`absolute right-0 top-full mt-2 bg-white text-text rounded-lg shadow-xl min-w-[220px] z-50 overflow-hidden transition-all duration-300 ease-in-out origin-top-right ${showUserMenu
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  }`}
              >
                <div className="p-3 border-b border-border bg-secondary">
                  <p className="font-medium text-base truncate text-black">{user?.fullName}</p>
                  <p className="text-sm text-text-light truncate text-black">{user?.email}</p>
                  <p className="text-xs text-text-light mt-1">
                    <span className="inline-block px-4 py-0.5 bg-primary text-white rounded-full capitalize">
                      {user?.role}
                    </span>
                  </p>
                </div>

                <div>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setShowUserMenu(false);
                    }}
                    className="font-medium w-full text-left px-4 py-2 hover:bg-blue-100 text-black cursor-pointer transition-colors flex items-center gap-2"
                  >
                    <User size={18} />
                    <span>Thông tin cá nhân</span>
                  </button>



                  <button
                    onClick={() => {
                      navigate('/my-reservations');
                      setShowUserMenu(false);
                    }}
                    className="font-medium w-full text-left px-4 py-2 hover:bg-blue-100 text-black cursor-pointer transition-colors flex items-center gap-2"
                  >
                    <Bookmark size={18} />
                    <span>Đặt mượn trước</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/my-favorites');
                      setShowUserMenu(false);
                    }}
                    className="font-medium w-full text-left px-4 py-2 hover:bg-blue-100 text-black cursor-pointer transition-colors flex items-center gap-2"
                  >
                    <FaRegHeart size={18} />
                    <span>Sách Yêu Thích</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate('/reader/compensation');
                      setShowUserMenu(false);
                    }}
                    className="font-medium w-full text-left px-4 py-2 hover:bg-blue-100 text-black cursor-pointer transition-colors flex items-center gap-2"
                  >
                    <CreditCard size={18} />
                    <span>Thanh toán phí</span>
                  </button>

                  <div className="border-t border-border my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="cursor-pointer w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-center gap-3 text-red-500 font-medium"
                  >
                    <LogOut size={18} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden bg-transparent border-none text-white cursor-pointer p-2"
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div ref={mobileSearchRef} className="lg:hidden px-4 pb-4 relative">
        <div className="w-full relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light z-10"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm Sách"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) {
                setShowSearchResults(true);
              }
            }}
            className="w-full p-2 pl-10 pr-10 rounded-md border-none outline-none text-sm text-text"
          />

          {/* Clear & Loading */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {searchQuery && !isSearching && (
              <button
                onClick={handleClearSearch}
                className="hover:bg-gray-200 rounded-full p-1 transition-colors"
              >
                <X size={16} className="text-text-light" />
              </button>
            )}
            {isSearching && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
          </div>
        </div>

        {/* Mobile Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-3 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-[450px] overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Kết quả tìm kiếm</p>
            </div>

            {/* Scrollable container */}
            <div className="max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {searchResults.map((book, index) => (
                <div
                  key={book._id || book.id}
                  onClick={(e) => {
                    console.log('🖱️ [Mobile] Book item clicked:', book.title);
                    e.preventDefault();
                    e.stopPropagation();
                    handleBookClick(book);
                  }}
                  className={`flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent cursor-pointer transition-all duration-200 group ${index !== searchResults.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                >
                  <div className="w-12 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex-shrink-0 overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                    {(book.coverImage || book.image) ? (
                      <img src={book.coverImage || book.image} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiBookOpen size={22} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">{book.title}</h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      <span className="font-medium">Tác giả:</span> {book.authorId?.name || 'Không rõ'}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {(book.availableCopies ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Còn {book.availableCopies ?? 0} cuốn
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          Hết sách
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleViewAllResults();
              }}
              className="w-full p-3.5 text-sm text-white font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-200 border-t border-gray-200 flex items-center justify-center gap-2 group"
            >
              <Search size={16} className="group-hover:scale-110 transition-transform" />
              Xem tất cả kết quả cho "{searchQuery}"
            </button>
          </div>
        )}

        {/* Mobile No Results */}
        {showSearchResults && searchResults.length === 0 && !isSearching && searchQuery.trim() && (
          <div className="absolute left-4 right-4 top-full mt-3 bg-white rounded-xl shadow-2xl border border-gray-100 p-6 z-50">
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Không tìm thấy kết quả
              </p>
              <p className="text-xs text-gray-500">
                Không có sách nào khớp với "{searchQuery}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        ref={mobileMenuRef}
        className={`lg:hidden bg-primary-dark overflow-hidden transition-all duration-300 ease-in-out ${showMobileMenu ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="px-4 py-3">
          {/* Category */}
          <button className="mb-3 w-full bg-white/10 hover:bg-white/20 text-white py-3 px-3 rounded-md flex items-center gap-3 transition-colors">
            <Menu size={18} />
            <span className="font-medium text-sm">Thể Loại</span>
          </button>

          {/* My Borrows */}
          <button
            onClick={() => handleNavigation('/my-borrows')}
            className="mb-3 w-full bg-white/10 hover:bg-white/20 text-white py-3 px-3 rounded-md flex items-center gap-3 transition-colors"
          >
            <ShoppingCart size={18} />
            <span className="font-medium text-sm">Danh Sách Mượn</span>
          </button>

          {isAuthenticated ? (
            <>
              {/* User Account Dropdown */}
              <div className="mb-3 bg-white/10 rounded-md overflow-hidden">
                <button
                  onClick={() => setShowMobileUserMenu(!showMobileUserMenu)}
                  className="w-full py-3 px-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{user?.fullName}</p>
                      <span className="inline-block px-2 py-0.5 bg-white/20 text-white text-xs rounded-full capitalize mt-0.5">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-white transition-transform duration-200 flex-shrink-0 ${showMobileUserMenu ? 'rotate-180' : ''
                      }`}
                  />
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${showMobileUserMenu ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                >
                  <div className="border-t border-white/10 bg-white/5">
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="w-full text-left py-2.5 px-4 hover:bg-white/10 text-white transition-colors flex items-center gap-3 text-sm"
                    >
                      <User size={16} />
                      <span>Thông tin cá nhân</span>
                    </button>

                    <button
                      onClick={() => handleNavigation('/history')}
                      className="w-full text-left py-2.5 px-4 hover:bg-white/10 text-white transition-colors flex items-center gap-3 text-sm"
                    >
                      <Package size={16} />
                      <span>Lịch Sử Mượn</span>
                    </button>

                    <button
                      onClick={() => handleNavigation('/my-reservations')}
                      className="w-full text-left py-2.5 px-4 hover:bg-white/10 text-white transition-colors flex items-center gap-3 text-sm"
                    >
                      <Bookmark size={16} />
                      <span>Đặt mượn trước</span>
                    </button>

                    <button
                      onClick={() => handleNavigation('/my-favorites')}
                      className="w-full text-left py-2.5 px-4 hover:bg-white/10 text-white transition-colors flex items-center gap-3 text-sm"
                    >
                      <FaRegHeart size={16} />
                      <span>Sách Yêu Thích</span>
                    </button>

                    <button
                      onClick={() => handleNavigation('/reader/compensation')}
                      className="w-full text-left py-2.5 px-4 hover:bg-white/10 text-white transition-colors flex items-center gap-3 text-sm"
                    >
                      <CreditCard size={16} />
                      <span>Thanh toán phí</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200 py-3 px-3 rounded-md flex items-center gap-3 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium text-sm">Đăng xuất</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleNavigation('/login')}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-3 rounded-md flex items-center gap-3 transition-colors"
            >
              <User size={18} />
              <span className="font-medium text-sm">Đăng nhập</span>
            </button>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc muốn đăng xuất khỏi hệ thống?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        type="warning"
      />
    </div>
  );
};

export default Header;

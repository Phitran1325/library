import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getEbookDownloadUrl } from "../../services/ebook.api";

interface LocationState {
  title?: string;
}

export const EbookReaderPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const [url, setUrl] = useState<string | null>(null);
  const [title] = useState<string>(state.title ?? "Đọc ebook");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!bookId) return;
      try {
        setLoading(true);
        const ebookUrl = await getEbookDownloadUrl(bookId);
        setUrl(ebookUrl);
      } catch (err) {
        console.error("Lỗi lấy URL ebook:", err);
        setError("Không thể tải ebook. Vui lòng quay lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchUrl();
  }, [bookId]);

  const openNewTab = () => {
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white">
      <header
        className="flex items-center justify-between px-4 py-3 border-b border-blue-900 shadow-md"
        style={{ backgroundColor: "#2F6FAD" }} // màu xanh navbar của bạn
      >
        {/* Nút quay lại */}
        <button
          onClick={() => navigate(-1)}
          className="
      group 
      inline-flex items-center gap-1 
      text-white/90 
      hover:text-white 
      transition 
      px-2 py-1 rounded-md
      hover:bg-white/10
    "
        >
          <ArrowLeft className="w-4 h-4 group-hover:scale-110 transition" />
          <span className="text-sm group-hover:underline">Quay lại</span>
        </button>

        {/* Tiêu đề Ebook */}
        <div className="text-center flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
            Ebook Reader
          </div>
          <div className="text-sm font-bold text-white px-4 truncate group hover:text-white transition">
            {title}
          </div>
        </div>

        {/* Nút mở tab mới */}
        <button
          onClick={openNewTab}
          className="
      group 
      inline-flex items-center gap-1 
      text-white/90 
      hover:text-white 
      transition 
      px-2 py-1 rounded-md
      hover:bg-white/10
    "
        >
          <ExternalLink className="w-4 h-4 group-hover:scale-110 transition" />
          <span className="text-xs group-hover:underline">Tab mới</span>
        </button>
      </header>

      {/* VÙNG IFRAME */}
      <main className="flex-1 bg-slate-900">
        {loading && (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm">
            Đang tải ebook...
          </div>
        )}

        {error && (
          <div className="w-full h-full flex items-center justify-center text-red-400 text-sm px-4 text-center">
            {error}
          </div>
        )}

        {url && !loading && !error && (
          <iframe
            src={url}
            className="w-full h-full border-0"
            allow="fullscreen 'none'"
          />
        )}
      </main>
    </div>
  );
};

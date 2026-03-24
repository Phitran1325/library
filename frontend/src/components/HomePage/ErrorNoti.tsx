interface ErrorNotiProps {
    errorMessage: string
}

const ErrorNoti = ({ errorMessage }: ErrorNotiProps) => {

    return (
        <div className="max-w-[1400px] mx-auto px-8 pt-4">
            <div className="bg-[#fff8e1] border-l-4 border-var(--color-warning) p-4 rounded-md mb-4">
                <div className="flex items-center">
                    <div className="shrink-0">
                        <svg className="h-5 w-5 text-var(--color-warning)" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-[#8b6914]">
                            <span className="font-medium">Lưu ý:</span> {errorMessage}. Đang hiển thị giao diện mặc định.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="ml-auto bg-[#fff8e1] hover:bg-[#ffecb3] text-[#8b6914] px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        </div>
    )
}
export default ErrorNoti
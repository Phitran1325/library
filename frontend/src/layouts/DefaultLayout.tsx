
import Header from '@/layouts/components/Header/Header';
import Footer from '@/layouts/components/Footer/Footer';
import ChatButton from '@/components/Chat/ChatButton';
import { Outlet } from 'react-router-dom';


const DefaultLayout = () => {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <Footer />

            {/* Chat Button */}
            <ChatButton />
        </div>
    );
};

export default DefaultLayout;
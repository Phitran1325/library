import Footer from '@/layouts/components/Footer/Footer';
import { Outlet } from 'react-router-dom';

const ProfileLayout = () => {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Main Content - No Header */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default ProfileLayout;


export type TabType = 'details' | 'reviews' | 'related';

interface Tab {
    id: TabType;
    label: string;
}

interface TabNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

const tabs: Tab[] = [
    { id: 'details', label: 'Chi tiết' },
    { id: 'reviews', label: 'Đánh giá' },
    { id: 'related', label: 'Sách liên quan' }
];

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
    return (
        <div className="flex gap-8 border-b border-border mb-8">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === tab.id
                        ? 'text-primary'
                        : 'text-text-light hover:text-text'
                        }`}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                </button>
            ))}
        </div>
    );
};
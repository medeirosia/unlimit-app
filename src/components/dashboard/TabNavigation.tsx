import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface Tab {
  id: string;
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  emoji: string;
  isLink?: boolean;
}

interface TabNavigationProps {
  availableTabs: Tab[];
  getGridCols: (count: number) => string;
}

export const TabNavigation = ({ availableTabs, getGridCols }: TabNavigationProps) => {
  const isMobile = useIsMobile();
  return (
    <TabsList className={`grid w-full ${getGridCols(availableTabs.length)} bg-white border shadow-sm`}>
      {availableTabs.map(tab => (
        <TabsTrigger
          key={tab.id}
          value={tab.id}
          className={`flex items-center justify-center ${isMobile ? 'gap-1 px-2' : 'gap-2'}`}
          {...(tab.isLink ? { asChild: true } : {})}
        >
          {tab.isLink ? (
            <Link to="/financeiro" className="flex items-center justify-center gap-1">
              <tab.icon className="h-4 w-4" />
              {!isMobile && <span>{tab.label}</span>}
            </Link>
          ) : (
            <>
              <tab.icon className="h-4 w-4" />
              {!isMobile && <span>{tab.label}</span>}
            </>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
};

import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface NavigationItem {
  title: string;
  url?: string;
}

interface NavigationProps {
  items: NavigationItem[];
}

export function Navigation({ items }: NavigationProps) {
  const { t } = useTranslation();

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <NavLink 
        to="/store/dashboard" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </NavLink>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          {item.url ? (
            <NavLink 
              to={item.url} 
              className="hover:text-foreground transition-colors"
            >
              {item.title}
            </NavLink>
          ) : (
            <span className="text-foreground font-medium">{item.title}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
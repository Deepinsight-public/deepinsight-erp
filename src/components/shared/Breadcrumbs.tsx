import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface BreadcrumbItem {
  title: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <NavLink 
        to="/store/dashboard" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Dashboard</span>
      </NavLink>
      
      {items.map((item, index) => (
        <div key={`breadcrumb-${index}`} className="flex items-center">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <NavLink 
              to={item.href} 
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
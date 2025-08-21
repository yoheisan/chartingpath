import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { 
  Code, 
  BookOpen, 
  Download, 
  Users, 
  Bell,
  Home,
  Settings
} from "lucide-react";

const MemberNavigation = () => {
  const location = useLocation();
  
  const navigationItems = [
    {
      to: "/",
      icon: Home,
      label: "Home",
    },
    {
      to: "/members/scripts",
      icon: Code,
      label: "Scripts",
    },
    {
      to: "/members/courses",
      icon: BookOpen,
      label: "Courses",
    },
    {
      to: "/members/downloads",
      icon: Download,
      label: "Downloads",
    },
    {
      to: "/members/alerts",
      icon: Bell,
      label: "Alerts",
      badge: "Pro"
    },
    {
      to: "/members/community",
      icon: Users,
      label: "Community",
    },
    {
      to: "/members/account",
      icon: Settings,
      label: "Account",
    },
  ];

  return (
    <nav className="mb-8">
      <div className="flex flex-wrap gap-2 justify-center">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          
          return (
            <Button
              key={item.to}
              variant={isActive ? "default" : "outline"}
              size="sm"
              asChild
              className="flex items-center gap-2"
            >
              <Link to={item.to}>
                <Icon className="h-4 w-4" />
                {item.label}
                {item.badge && (
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

export default MemberNavigation;
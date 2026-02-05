import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { 
  Home,
  FolderKanban,
  Download,
  Settings
} from "lucide-react";

const MemberNavigation = () => {
  const location = useLocation();
  
  const navigationItems = [
    {
      to: "/members/dashboard",
      icon: Home,
      label: "Dashboard",
      primary: true
    },
    {
      to: "/projects",
      icon: FolderKanban,
      label: "Projects",
    },
    {
      to: "/members/downloads",
      icon: Download,
      label: "Downloads",
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
          const isPrimary = item.primary;
          
          return (
            <Button
              key={item.to}
              variant={isActive ? "default" : isPrimary ? "secondary" : "outline"}
              size={isPrimary ? "default" : "sm"}
              asChild
              className={`flex items-center gap-2 ${isPrimary ? "font-semibold shadow-md" : ""}`}
            >
              <Link to={item.to}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </nav>
  );
};

export default MemberNavigation;

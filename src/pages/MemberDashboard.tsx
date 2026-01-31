import { useRequireAuth } from "@/hooks/useRequireAuth";
import { CommandCenterLayout } from "@/components/command-center";
import { Skeleton } from "@/components/ui/skeleton";

const MemberDashboard = () => {
  const { user, loading: authLoading } = useRequireAuth();

  // Loading state - auth check
  if (authLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  // If still no user after auth check, the hook will redirect
  if (!user) {
    return null;
  }

  return <CommandCenterLayout userId={user.id} />;
};

export default MemberDashboard;

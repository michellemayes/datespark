import { Button } from "@/components/ui/button";
import { Heart, LogOut } from "lucide-react";

interface NavigationProps {
  user: any;
  onSignOut: () => void;
  onSignIn: () => void;
}

export const Navigation = ({ user, onSignOut, onSignIn }: NavigationProps) => {
  return (
    <div className="flex justify-end gap-2 mb-4">
      {user && (
        <Button variant="ghost" onClick={() => window.location.href = '/saved'}>
          <Heart className="mr-2 h-4 w-4" />
          Favorite Dates
        </Button>
      )}
      {user ? (
        <Button variant="ghost" onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      ) : (
        <Button variant="ghost" onClick={onSignIn}>
          Sign In
        </Button>
      )}
    </div>
  );
};

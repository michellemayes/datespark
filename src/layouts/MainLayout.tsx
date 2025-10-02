import { ReactNode } from "react";
import { Navigation } from "@/components/Navigation";

interface MainLayoutProps {
  children: ReactNode;
  user: any;
  onSignOut: () => void;
  onSignIn: () => void;
}

export const MainLayout = ({ children, user, onSignOut, onSignIn }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-8">
        <Navigation user={user} onSignOut={onSignOut} onSignIn={onSignIn} />
        {children}
      </div>
    </div>
  );
};

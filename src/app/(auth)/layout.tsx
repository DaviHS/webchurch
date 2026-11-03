import { type PropsWithChildren } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const AuthLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <div className="relative min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/10 text-foreground">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
};

export default AuthLayout;

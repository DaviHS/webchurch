import { type PropsWithChildren } from "react";

const AuthLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return <div className="h-screen">{children}</div>;
};

export default AuthLayout;

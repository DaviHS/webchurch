import { type PropsWithChildren } from "react";

const AuthLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return <div className="h-screen px-4">{children}</div>;
};

export default AuthLayout;

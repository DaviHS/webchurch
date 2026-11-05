import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig } from "./config";

const {
  auth: uncachedAuth,
  handlers,
  signIn,
  signOut,
  unstable_update: update,
} = NextAuth(authConfig);

const auth = cache(uncachedAuth);
const authProxy = uncachedAuth;

export { auth, authProxy, handlers, signIn, signOut, update };

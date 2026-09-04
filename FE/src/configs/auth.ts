export type AuthRole = "candidate" | "company" | "admin";

export interface AuthRoleConfig {
  role: AuthRole;
  /** API path prefix — e.g. "/candidate", "/company", "/admin/auth". */
  apiPrefix: string;
  /** Frontend route prefix — e.g. "/candidate", "/company", "/admin". */
  basePath: string;
  /** Landing route after a successful login (used when useRedirectParam is false or ?redirect= is absent). */
  loginRedirect: string;
  /** Honour a `?redirect=` query param on the login page. */
  useRedirectParam: boolean;
  /** Which set of register fields to render. */
  registerKind: "person" | "company";
}

export const AUTH_CONFIG: Record<AuthRole, AuthRoleConfig> = {
  candidate: {
    role: "candidate",
    apiPrefix: "/candidate",
    basePath: "/candidate",
    loginRedirect: "/",
    useRedirectParam: true,
    registerKind: "person",
  },
  company: {
    role: "company",
    apiPrefix: "/company",
    basePath: "/company",
    loginRedirect: "/",
    useRedirectParam: true,
    registerKind: "company",
  },
  admin: {
    role: "admin",
    apiPrefix: "/admin/auth",
    basePath: "/admin",
    loginRedirect: "/admin-manage/dashboard",
    useRedirectParam: false,
    registerKind: "person",
  },
};

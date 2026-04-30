export type UserRole = "diaspora" | "agence";
export type AdminRole = "admin";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  location?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

import { createContext } from "react";

import type { AuthUser, TeacherAssignment } from "@/types/auth";

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, passwordHash: string) => Promise<AuthUser>;
  showcaseLogin: (email: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateAssignments: (assignments: TeacherAssignment) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

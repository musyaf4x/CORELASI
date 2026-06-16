import type { AuthUser } from "./auth";

export interface UserDetail extends AuthUser {
  nipOrNis?: string;
  gender?: "L" | "P";
  phoneNumber?: string;
  kelasId?: string | null;
  angkatan?: number;
}

export interface ResetRequest {
  id: string;
  email: string;
  name: string;
  role: string;
  requestedAt: string;
  status: "pending" | "resolved";
}

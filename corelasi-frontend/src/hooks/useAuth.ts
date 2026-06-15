import { useContext } from "react";
import { AuthContext } from "@/app/authContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AppProviders");
  }
  return context;
};

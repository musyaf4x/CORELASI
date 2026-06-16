import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { TeacherAssignment } from "@/types/auth";

interface AssignmentGuardProps {
  children: React.ReactNode;
  requiredAssignment: keyof TeacherAssignment;
}

export const AssignmentGuard: React.FC<AssignmentGuardProps> = ({
  children,
  requiredAssignment,
}) => {
  const { user } = useAuth();

  if (!user || user.role !== "guru") {
    return <Navigate to="/403" replace />;
  }

  const hasAssignment = user.assignments?.[requiredAssignment] === true;

  if (!hasAssignment) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

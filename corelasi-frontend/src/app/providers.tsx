import React, { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AuthUser, TeacherAssignment } from "@/types/auth";
import { authService } from "@/services/authService";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ApiError } from "@/types/api";
import { AuthContext } from "@/app/authContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (ApiError.is(error)) {
          if (error.statusCode >= 400 && error.statusCode < 500) return false;
        }
        return failureCount < 1;
      },
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const authOperationId = useRef(0);

  useEffect(() => {
    let active = true;
    const operationId = ++authOperationId.current;

    void authService.initializeSession().then((activeUser) => {
      if (!active || authOperationId.current !== operationId) return;
      setUser(activeUser);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const login = async (
    email: string,
    passwordHash: string,
  ): Promise<AuthUser> => {
    const operationId = ++authOperationId.current;
    setLoading(true);
    try {
      const loggedUser = await authService.login(email, passwordHash);
      if (authOperationId.current === operationId) {
        setUser(loggedUser);
      }
      return loggedUser;
    } finally {
      if (authOperationId.current === operationId) {
        setLoading(false);
      }
    }
  };

  const showcaseLogin = async (email: string): Promise<AuthUser> => {
    const operationId = ++authOperationId.current;
    setLoading(true);
    try {
      const loggedUser = await authService.showcaseLogin(email);
      if (authOperationId.current === operationId) {
        setUser(loggedUser);
      }
      return loggedUser;
    } finally {
      if (authOperationId.current === operationId) {
        setLoading(false);
      }
    }
  };

  const logout = async (): Promise<void> => {
    const operationId = ++authOperationId.current;
    setLoading(true);
    try {
      await authService.logout();
      if (authOperationId.current === operationId) {
        queryClient.clear();
        setUser(null);
      }
    } finally {
      if (authOperationId.current === operationId) {
        setLoading(false);
      }
    }
  };

  const updateAssignments = (assignments: TeacherAssignment): void => {
    const updatedUser = authService.updateAssignments(assignments);
    if (updatedUser) {
      setUser(updatedUser);
    }
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            user,
            loading,
            login,
            showcaseLogin,
            logout,
            updateAssignments,
          }}
        >
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

import { useAuth } from "@/components/AuthProvider";
import { useRouter, useSegments } from "expo-router";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!loading && !user) {
      // Save the requested route for redirect after login
      const requested = "/" + segments.join("/");
      router.replace({
        pathname: "/Login/UserLogin",
        params: { redirect: requested },
      });
    }
  }, [user, loading, segments]);

  if (loading) return null; // Or a loading spinner
  if (!user) return null;
  return <>{children}</>;
}

import { LoginForm } from "@/components/LoginForm";
import { queryClient } from "@/lib/queryClient";

export default function Landing() {
  const handleLoginSuccess = () => {
    // Invalidate the auth query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  return <LoginForm onLoginSuccess={handleLoginSuccess} />;
}
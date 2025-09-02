import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, Monitor } from "lucide-react";
import { loginSchema, type LoginInput } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      return await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      setErrorMessage("");
      onLoginSuccess();
    },
    onError: (error: any) => {
      const message = error.message || "Login failed. Please try again.";
      setErrorMessage(message);
    },
  });

  const onSubmit = (data: LoginInput) => {
    setErrorMessage("");
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Monitor className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            EIMS Login
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Edge Infrastructure Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage && (
            <Alert variant="destructive" data-testid="error-alert">
              <Shield className="h-4 w-4" />
              <AlertDescription data-testid="error-message">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        data-testid="input-email"
                        disabled={loginMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        data-testid="input-password"
                        disabled={loginMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p className="font-medium">Demo User Accounts:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <p className="font-medium">NEC General</p>
                  <p>general@nec.com</p>
                  <p>password123</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <p className="font-medium">NEC Engineer</p>
                  <p>engineer@nec.com</p>
                  <p>password123</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <p className="font-medium">NEC Admin</p>
                  <p>admin@nec.com</p>
                  <p>password123</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                  <p className="font-medium">Client</p>
                  <p>client@company.com</p>
                  <p>password123</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
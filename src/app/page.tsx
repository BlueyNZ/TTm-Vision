
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrafficCone, Building2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";

export default function HomePage() {
  const router = useRouter();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="w-full max-w-5xl space-y-8 animate-in fade-in duration-500">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <TrafficCone className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Welcome to TTM Vision
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Traffic Management & Fleet Operations Platform
            </p>
          </div>

          {/* Selection Cards */}
          <div className="grid gap-6 md:grid-cols-2 mt-12">
            {/* Staff Login Card */}
            <Card 
              className="cursor-pointer transition-all hover:scale-105 hover:shadow-2xl border-2 hover:border-primary group"
              onClick={() => router.push('/login')}
            >
              <CardHeader className="text-center space-y-4 pb-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <TrafficCone className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Staff Portal</CardTitle>
                <CardDescription className="text-base">
                  For traffic controllers, operators, and administrators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    Manage jobs and schedules
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    Track fleet and equipment
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    Monitor certifications and licenses
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    Admin and reporting tools
                  </li>
                </ul>
                <Button 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  variant="outline"
                  size="lg"
                >
                  Staff Login
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            {/* Client Login Card */}
            <Card 
              className="cursor-pointer transition-all hover:scale-105 hover:shadow-2xl border-2 hover:border-blue-500 group"
              onClick={() => router.push('/client-login')}
            >
              <CardHeader className="text-center space-y-4 pb-4">
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <Building2 className="h-12 w-12 text-blue-500" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Client Portal</CardTitle>
                <CardDescription className="text-base">
                  For companies and organizations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    Request traffic management services
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    Track job status in real-time
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    View assigned staff and equipment
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    Access paperwork and documentation
                  </li>
                </ul>
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white transition-all"
                  size="lg"
                >
                  Client Login
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center space-y-3 pt-8">
            <p className="text-sm text-muted-foreground">
              Traffic management company?{" "}
              <button
                onClick={() => router.push('/company-signup')}
                className="text-primary hover:underline font-medium"
              >
                Create your account
              </button>
            </p>
            <p className="text-sm text-muted-foreground">
              Need traffic management services?{" "}
              <button
                onClick={() => router.push('/client-signup')}
                className="text-primary hover:underline font-medium"
              >
                Register as a client
              </button>
            </p>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

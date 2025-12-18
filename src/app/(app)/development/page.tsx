'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  Bug, 
  Database, 
  Code, 
  Building2, 
  TestTube, 
  Activity,
  ArrowRight,
  Shield,
  AlertCircle,
  Mail
} from 'lucide-react';
import { TestEmailDialog } from '@/components/development/test-email-dialog';

export default function DevelopmentPage() {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true);
          setIsSuperAdmin(tokenResult.claims.superAdmin === true);
        } catch (error) {
          setIsSuperAdmin(false);
        }
      } else {
        setIsSuperAdmin(false);
      }
    };
    
    checkSuperAdmin();
  }, [user]);

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need super admin privileges to access the development area.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const devTools = [
    {
      title: 'Bug Reports',
      description: 'View and manage bug reports submitted by users across all tenants',
      icon: Bug,
      href: '/development/bug-reports',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Dev Logs',
      description: 'Monitor error logs and debug information captured automatically',
      icon: Database,
      href: '/development/logs',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Test Email Service',
      description: 'Send test emails to verify templates and Firebase email configuration',
      icon: Mail,
      isDialog: true,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Manage Companies',
      description: 'View and manage all tenant companies in the system',
      icon: Building2,
      href: '/dev',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Test Claims',
      description: 'Test and debug custom claims and permissions',
      icon: TestTube,
      href: '/test-claims',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Diagnostics',
      description: 'Run system diagnostics and health checks',
      icon: Activity,
      href: '/diagnostics',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Code className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Development Center</h1>
            <p className="text-muted-foreground">
              Super admin tools for debugging, monitoring, and managing the system
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            Super Admin Only
          </Badge>
          <Badge variant="secondary">
            Global Access
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devTools.map((tool, index) => {
          if (tool.isDialog) {
            // Render dialog-based tool
            return (
              <Card 
                key={`dialog-${index}`}
                className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${tool.bgColor} mb-3`}>
                      <tool.icon className={`h-6 w-6 ${tool.color}`} />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TestEmailDialog>
                    <Button 
                      variant="ghost" 
                      className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      Open Tool
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </TestEmailDialog>
                </CardContent>
              </Card>
            );
          }

          // Render navigation-based tool
          return (
            <Card 
              key={tool.href} 
              className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50"
              onClick={() => router.push(tool.href)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${tool.bgColor} mb-3`}>
                    <tool.icon className={`h-6 w-6 ${tool.color}`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <CardTitle className="text-xl">{tool.title}</CardTitle>
                <CardDescription className="text-sm">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(tool.href);
                  }}
                >
                  Open Tool
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 border-yellow-500/50 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>🌐 Global Access:</strong> All tools show data from all tenants/companies. You can monitor and debug across the entire system.
          </p>
          <p>
            <strong>🔐 Security:</strong> These tools are only accessible to super admins. Regular users cannot see or access this area.
          </p>
          <p>
            <strong>📱 Mobile Friendly:</strong> All dev tools are optimized for mobile viewing, so you can monitor issues on the go.
          </p>
          <p>
            <strong>⚡ Auto-Logging:</strong> Enable auto-logging in the Debug Panel (bottom-right bug icon) to automatically capture errors to Dev Logs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

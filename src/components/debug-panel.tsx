'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bug, X, ChevronDown, ChevronUp } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<Array<{ time: string; type: string; message: string; data?: any }>>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const user = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();

  // Check if user is super admin
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

  // Don't render anything if not super admin
  if (!isSuperAdmin) {
    return null;
  }

  // Intercept console methods
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const addLog = (type: string, args: any[]) => {
      const time = new Date().toLocaleTimeString();
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        setLogs(prev => [...prev.slice(-99), { time, type, message, data: args }]);
      }, 0);
    };

    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    console.log = (...args: any[]) => {
      originalConsole.log(...args);
      addLog('log', args);
    };

    console.error = (...args: any[]) => {
      originalConsole.error(...args);
      addLog('error', args);
    };

    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      addLog('warn', args);
    };

    console.info = (...args: any[]) => {
      originalConsole.info(...args);
      addLog('info', args);
    };

    return () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
    };
  }, []);

  // Show debug toggle button in bottom-right corner
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 p-0"
        variant="outline"
        title="Open Debug Panel"
      >
        <Bug className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] flex flex-col shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Debug Panel
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 overflow-auto flex-1 text-xs">
        {/* System Info */}
        <div>
          <div className="font-semibold mb-1">System Info</div>
          <div className="space-y-1 text-muted-foreground">
            <div>Path: <code className="text-xs bg-muted px-1 rounded">{pathname}</code></div>
            <div>User: {user ? (
              <Badge variant="outline" className="text-xs">{(user as any).email || (user as any).uid}</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Not logged in</Badge>
            )}</div>
            <div>Firestore: {firestore ? (
              <Badge variant="outline" className="text-xs bg-green-100">Connected</Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">Disconnected</Badge>
            )}</div>
            <div>Environment: <Badge variant="outline" className="text-xs">
              {process.env.NODE_ENV}
            </Badge></div>
          </div>
        </div>

        <Separator />

        {/* Expanded Debug Info */}
        {isExpanded && (
          <>
            <div>
              <div className="font-semibold mb-1">User Details</div>
              {user ? (
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify({
                    uid: (user as any).uid,
                    email: (user as any).email,
                    emailVerified: (user as any).emailVerified,
                    displayName: (user as any).displayName,
                  }, null, 2)}
                </pre>
              ) : (
                <div className="text-muted-foreground">No user logged in</div>
              )}
            </div>

            <Separator />

            <div>
              <div className="font-semibold mb-1 flex items-center justify-between">
                Console Logs
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLogs([])}
                  className="h-6 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-1 max-h-64 overflow-auto">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground">No logs yet</div>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-2 rounded text-xs",
                        log.type === 'error' && "bg-red-100 text-red-900",
                        log.type === 'warn' && "bg-yellow-100 text-yellow-900",
                        log.type === 'info' && "bg-blue-100 text-blue-900",
                        log.type === 'log' && "bg-muted"
                      )}
                    >
                      <div className="font-mono text-[10px] text-muted-foreground mb-1">
                        [{log.time}] {log.type.toUpperCase()}
                      </div>
                      <pre className="whitespace-pre-wrap break-words font-mono">
                        {log.message}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Separator />

            <div>
              <div className="font-semibold mb-1">Local Storage</div>
              <div className="space-y-1 max-h-32 overflow-auto">
                {typeof window !== 'undefined' && Object.keys(localStorage).length > 0 ? (
                  Object.keys(localStorage).map(key => (
                    <div key={key} className="text-xs">
                      <code className="bg-muted px-1 rounded">{key}</code>:{' '}
                      <span className="text-muted-foreground">
                        {localStorage.getItem(key)?.substring(0, 50)}...
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No items in localStorage</div>
                )}
              </div>
            </div>
          </>
        )}

        {!isExpanded && (
          <div className="text-center text-muted-foreground">
            Click ↑ to expand full debug info
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

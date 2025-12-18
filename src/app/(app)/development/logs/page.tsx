'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, orderBy, limit, where, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, RefreshCw, Search, Filter, Database, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DevLog {
  id: string;
  type: 'error' | 'warn' | 'info' | 'log';
  message: string;
  stack?: string;
  timestamp: any;
  userInfo: {
    uid: string | null;
    email: string | null;
    displayName: string | null;
  };
  pageInfo: {
    pathname: string;
    url: string;
    userAgent: string;
  };
  data?: any;
}

export default function DevLogsPage() {
  const [logs, setLogs] = useState<DevLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

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

  // Fetch logs
  const fetchLogs = async () => {
    if (!isSuperAdmin) return;
    
    setLoading(true);
    try {
      const logsCollection = collection(firestore, 'dev_logs');
      let q = query(
        logsCollection,
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      if (filterType !== 'all') {
        q = query(
          logsCollection,
          where('type', '==', filterType),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      const fetchedLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as DevLog[];

      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchLogs();
    }
  }, [isSuperAdmin, filterType]);

  // Delete a specific log
  const deleteLog = async (logId: string) => {
    try {
      await deleteDoc(doc(firestore, 'dev_logs', logId));
      setLogs(logs.filter(log => log.id !== logId));
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  // Clear all logs
  const clearAllLogs = async () => {
    if (!confirm('Are you sure you want to delete all logs?')) return;
    
    try {
      const promises = logs.map(log => deleteDoc(doc(firestore, 'dev_logs', log.id)));
      await Promise.all(promises);
      setLogs([]);
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  // Filter logs by search term
  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.pageInfo.pathname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need super admin privileges to access dev logs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="h-8 w-8" />
          Development Logs
        </h1>
        <p className="text-muted-foreground">
          View and manage error logs captured from the application. 
          Enable auto-logging in the Debug Panel to start collecting logs.
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warn">Warnings</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="log">Logs</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={fetchLogs}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>

            <Button
              variant="destructive"
              onClick={clearAllLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{logs.length}</div>
            <div className="text-xs text-muted-foreground">Total Logs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.type === 'error').length}
            </div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {logs.filter(l => l.type === 'warn').length}
            </div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {logs.filter(l => l.type === 'info' || l.type === 'log').length}
            </div>
            <div className="text-xs text-muted-foreground">Info/Logs</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading logs...</p>
            </CardContent>
          </Card>
        ) : filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Logs Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Enable auto-logging in the Debug Panel to start collecting logs.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} className={cn(
              "border-l-4",
              log.type === 'error' && "border-l-red-500",
              log.type === 'warn' && "border-l-yellow-500",
              log.type === 'info' && "border-l-blue-500",
              log.type === 'log' && "border-l-gray-500"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-white",
                          log.type === 'error' && "bg-red-500",
                          log.type === 'warn' && "bg-yellow-500",
                          log.type === 'info' && "bg-blue-500",
                          log.type === 'log' && "bg-gray-500"
                        )}
                      >
                        {log.type.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PPp') : 'Unknown time'}
                      </span>
                    </div>
                    <div className="text-sm font-mono bg-muted p-2 rounded break-all">
                      {log.message}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLog(log.id)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-muted-foreground">
                      <strong>Page:</strong> {log.pageInfo.pathname}
                    </span>
                    {log.userInfo.email && (
                      <span className="text-muted-foreground">
                        <strong>User:</strong> {log.userInfo.email}
                      </span>
                    )}
                  </div>
                  {log.stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View stack trace
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {log.stack}
                      </pre>
                    </details>
                  )}
                  <details className="mt-2">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View full details
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(log, null, 2)}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

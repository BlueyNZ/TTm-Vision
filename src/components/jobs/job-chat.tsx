'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser } from '@/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  serverTimestamp,
  limit 
} from 'firebase/firestore';
import { MessageSquare, Send, LoaderCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface JobChatProps {
  jobId: string;
  jobLocation: string;
  isInDialog?: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Timestamp;
  type?: 'system' | 'user';
}

export function JobChat({ jobId, jobLocation, isInDialog = false }: JobChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isInDialog);
  const firestore = useFirestore();
  const { user } = useUser();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const lastMessageCountRef = useRef(0);

  // Get user name from email or use fallback
  const userName = (user as any)?.displayName || (user as any)?.email?.split('@')[0] || 'Anonymous';

  // Real-time message subscription
  useEffect(() => {
    if (!firestore || !jobId) return;

    const messagesRef = collection(firestore, 'job_packs', jobId, 'chat_messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      
      // Show notification for new messages from others
      if (lastMessageCountRef.current > 0 && fetchedMessages.length > lastMessageCountRef.current) {
        const newMessages = fetchedMessages.slice(lastMessageCountRef.current);
        newMessages.forEach(msg => {
          if (msg.userId !== (user as any)?.uid) {
            toast({
              title: `${msg.userName} sent a message`,
              description: msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message,
              duration: 3000,
            });
          }
        });
      }
      
      lastMessageCountRef.current = fetchedMessages.length;
      setMessages(fetchedMessages);
      
      // Auto-scroll to bottom when new messages arrive
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [firestore, jobId, user, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !firestore || !user || isSending) return;

    setIsSending(true);
    try {
      const messagesRef = collection(firestore, 'job_packs', jobId, 'chat_messages');
      await addDoc(messagesRef, {
        userId: (user as any).uid,
        userName,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        type: 'user',
      });
      
      toast({
        title: "Message sent",
        description: "Your message has been sent to the job chat",
        duration: 2000,
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const unreadCount = 0; // Could track this with local storage or user read status

  if (!isExpanded && !isInDialog) {
    return (
      <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setIsExpanded(true)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Job Chat</p>
                <p className="text-xs text-muted-foreground">
                  {messages.length} message{messages.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Badge variant="default" className="bg-primary">
                {unreadCount}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Job Chat
          </CardTitle>
          {!isInDialog && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              Minimize
            </Button>
          )}
        </div>
        {!isInDialog && (
          <p className="text-xs text-muted-foreground mt-1">
            Real-time messaging for {jobLocation}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages Area */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg, index) => {
                const isCurrentUser = (user as any)?.uid === msg.userId;
                const showAvatar = index === 0 || messages[index - 1].userId !== msg.userId;
                
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-3',
                      isCurrentUser && 'flex-row-reverse'
                    )}
                  >
                    {showAvatar ? (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className={cn(
                          'text-xs',
                          isCurrentUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                        )}>
                          {getInitials(msg.userName)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}
                    
                    <div className={cn(
                      'flex-1 max-w-[70%]',
                      isCurrentUser && 'flex flex-col items-end'
                    )}>
                      {showAvatar && (
                        <div className={cn(
                          'flex items-center gap-2 mb-1',
                          isCurrentUser && 'flex-row-reverse'
                        )}>
                          <span className="text-xs font-medium">{msg.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(msg.timestamp)}
                          </span>
                        </div>
                      )}
                      
                      <div className={cn(
                        'rounded-lg px-3 py-2 break-words',
                        isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      
                      {!showAvatar && (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {formatMessageTime(msg.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
            maxLength={500}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground text-center">
          Messages are saved with job paperwork • {messages.length}/100 messages
        </p>
      </CardContent>
    </Card>
  );
}

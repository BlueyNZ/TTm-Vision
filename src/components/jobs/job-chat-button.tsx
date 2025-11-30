'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { JobChat } from './job-chat';

interface JobChatButtonProps {
  jobId: string;
  jobLocation: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function JobChatButton({ 
  jobId, 
  jobLocation, 
  variant = 'ghost',
  size = 'icon',
  showLabel = false 
}: JobChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        onClick={handleClick}
        title="Open job chat"
        type="button"
        className={showLabel ? "flex items-center gap-2" : ""}
      >
        <MessageSquare className={showLabel ? "h-4 w-4 flex-shrink-0" : "h-4 w-4"} />
        {showLabel && <span className="whitespace-nowrap">Chat</span>}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Job Chat - {jobLocation}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {isOpen && <JobChat jobId={jobId} jobLocation={jobLocation} isInDialog={true} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

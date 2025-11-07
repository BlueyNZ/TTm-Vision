
"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import SignatureCanvas from "react-signature-canvas";
import { cn } from "@/lib/utils";

interface SignaturePadProps extends React.ComponentProps<typeof SignatureCanvas> {
  onSignatureEnd?: () => void;
}

export interface SignaturePadRef {
  clear: () => void;
  toDataURL: (type?: string, encoderOptions?: number) => string;
  isEmpty: () => boolean;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ className, onSignatureEnd, ...props }, ref) => {
    const canvasRef = useRef<SignatureCanvas | null>(null);

    useImperativeHandle(ref, () => ({
      clear: () => {
        canvasRef.current?.clear();
      },
      toDataURL: (type?: string, encoderOptions?: number) => {
        return canvasRef.current?.toDataURL(type, encoderOptions) || "";
      },
      isEmpty: () => {
        return canvasRef.current?.isEmpty() ?? true;
      },
    }));

    return (
      <div
        className={cn(
          "relative w-full h-48 rounded-md border border-input bg-background",
          className
        )}
      >
        <SignatureCanvas
          ref={canvasRef}
          canvasProps={{
            className: "w-full h-full",
          }}
          penColor="hsl(var(--foreground))"
          onEnd={onSignatureEnd}
          {...props}
        />
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";

export { SignaturePad };

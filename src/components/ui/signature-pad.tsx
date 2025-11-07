
"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect
} from "react";
import SignatureCanvas from "react-signature-canvas";
import { cn } from "@/lib/utils";

interface SignaturePadProps extends Omit<React.ComponentProps<typeof SignatureCanvas>, 'canvasProps'> {
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
    const containerRef = useRef<HTMLDivElement>(null);

    // This effect ensures the canvas resizes correctly if the window/container size changes.
    useEffect(() => {
        function handleResize() {
            if (canvasRef.current && containerRef.current) {
                const canvas = canvasRef.current.getCanvas();
                const { width } = containerRef.current.getBoundingClientRect();
                canvas.width = width;
                canvas.height = 192; // h-48
                canvasRef.current.clear(); // Clear canvas on resize to avoid distortion
            }
        }
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial size set
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        ref={containerRef}
        className={cn(
          "relative w-full h-48 rounded-md border border-input bg-background",
          className
        )}
      >
        <SignatureCanvas
          ref={canvasRef}
          canvasProps={{
            // The key is to set width/height directly on the canvas element
            // We set a placeholder here and resize dynamically with the useEffect hook
            width: 500,
            height: 192,
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

/**
 * Alert Component
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/lib/utils";


const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-950 dark:[&>svg]:text-gray-50",
  {
    variants: {
      variant: {
        default: "bg-white text-gray-950 border-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50",
        destructive:
          "border-red-500/50 text-red-800 dark:text-red-400 [&>svg]:text-red-600 dark:[&>svg]:text-red-600 bg-red-50 dark:bg-red-900/20",
        success:
          "border-green-500/50 text-green-800 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-600 bg-green-50 dark:bg-green-900/20",
        warning:
          "border-yellow-500/50 text-yellow-800 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };

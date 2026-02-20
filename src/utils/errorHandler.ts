
import { toast } from "@/hooks/use-toast";

/**
 * Standardized error handling utility
 * Provides consistent error logging and user feedback
 */

interface ErrorOptions {
  title?: string;
  duration?: number;
  silent?: boolean;
  context?: string;
  logInProduction?: boolean;
}

/**
 * Handle errors with consistent logging and optional user feedback
 */
export const handleError = (
  error: unknown, 
  message: string, 
  options: ErrorOptions = {}
): void => {
  const {
    title = "Error",
    duration = 3000,
    silent = false,
    context = "application",
    logInProduction = true
  } = options;
  
  // Log in development always, but in production only if explicitly requested
  if (process.env.NODE_ENV !== 'production' || logInProduction) {
    console.error(`[${context}] ${message}:`, error);
  }
  
  // Only show toast if not silent
  if (!silent) {
    toast({
      variant: "destructive",
      title,
      description: typeof error === 'string' ? error : message,
      duration
    });
  }
};

/**
 * Handle successful operations with consistent logging and user feedback
 */
export const handleSuccess = (
  message: string,
  options: Omit<ErrorOptions, 'silent' | 'logInProduction'> = {}
): void => {
  const {
    title = "Success",
    duration = 3000,
    context = "application"
  } = options;
  
  // Log success in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${context}] ${message}`);
  }
  
  toast({
    title,
    description: message,
    duration
  });
};

/**
 * Log debug messages (only in development)
 */
export const logDebug = (message: string, context: string = "debug", data?: any): void => {
  if (process.env.NODE_ENV !== 'production') {
    if (data) {
      console.log(`[${context}] ${message}:`, data);
    } else {
      console.log(`[${context}] ${message}`);
    }
  }
};

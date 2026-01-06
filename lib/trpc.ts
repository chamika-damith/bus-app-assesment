import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

// Define a basic router type for now
// Replace this with your actual backend router type when available
type AppRouter = any; // Temporary fix for TypeScript

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.204.176:3000/trpc',
      transformer: superjson,
    }),
  ],
});

// Query client configuration
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
};
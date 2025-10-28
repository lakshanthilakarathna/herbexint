import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    force: true,
  },
  build: {
    // Performance optimizations
    target: 'esnext',
    minify: 'esbuild', // Use esbuild instead of terser
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          charts: ['recharts'],
          utils: ['date-fns', 'lucide-react'],
          // Keep GPS functions in main bundle to avoid loading issues
          // location: ['@/lib/locationUtils'],
        },
      },
    },
    // Enable compression
    chunkSizeWarningLimit: 1000,
  },
  // Enable gzip compression
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
}));

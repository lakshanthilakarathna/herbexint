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
          // Core React
          vendor: ['react', 'react-dom', 'react-router-dom'],
          
          // Radix UI components (split into smaller chunks)
          'ui-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-label'
          ],
          'ui-extended': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group'
          ],
          
          // Charts library
          charts: ['recharts'],
          
          // Utilities
          utils: ['date-fns', 'lucide-react', 'clsx', 'tailwind-merge']
        },
        
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    // Enable compression
    chunkSizeWarningLimit: 600, // Lower threshold to catch issues
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
  // Enable gzip compression
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
}));

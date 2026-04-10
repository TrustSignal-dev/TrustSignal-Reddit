import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { devvit } from '@devvit/start/vite';

export default defineConfig(() => ({
  plugins: process.env.VITEST ? [react()] : [react(), devvit()],
}));

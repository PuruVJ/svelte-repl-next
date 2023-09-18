import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		exclude: ['@neocodemirror/svelte', '@codemirror/state'],
	},
	resolve: {
		dedupe: ['@codemirror/state'],
	},
});

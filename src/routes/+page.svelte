<script>
	// @ts-check
	import Repl from '$lib/Repl.svelte';
	import '@fontsource/fira-mono';
	import '@sveltejs/site-kit/styles/index.css';
	import { WebContainer } from '@webcontainer/api';
	import { onMount } from 'svelte';

	/** @type {import('$lib/types').InputFile[]} */
	let files = [
		{
			path: 'package.json',
			content: `{
	"name": "~TODO~",
	"version": "0.0.1",
	"private": true,
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview"
	},
	"devDependencies": {
		"@sveltejs/adapter-auto": "^2.0.0",
		"@sveltejs/kit": "^1.20.4",
		"svelte": "^4.0.5",
		"vite": "^4.4.2"
	},
	"type": "module"
}`,
		},
		{
			path: 'svelte.config.js',
			content: `import adapter from '@sveltejs/adapter-auto';

// This config is ignored and replaced with one of the configs in the shared folder when a project is created.

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
	}
};

export default config;`,
		},
		{
			path: 'vite.config.js',
			content: `import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()]
});`,
		},
		{
			path: 'src/app.html',
			content: `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>`,
		},
		{
			path: 'src/routes/+page.svelte',
			content: `<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>`,
		},
	];

	/** @type {WebContainer} */
	let webcontainer;

	async function init_webcontainer() {
		webcontainer = await WebContainer.boot();
	}

	onMount(() => {
		init_webcontainer();
	});
</script>

<main>
	<Repl {files} mode="webcontainer" {webcontainer} />
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
	}

	main {
		height: 100vh;
	}
</style>

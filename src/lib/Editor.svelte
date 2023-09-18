<script>
	import { html } from '@codemirror/lang-html';
	import { javascript } from '@codemirror/lang-javascript';
	import { json } from '@codemirror/lang-json';
	import { codemirror } from '@neocodemirror/svelte';
	import { svelte } from '@replit/codemirror-lang-svelte';
	import { createEventDispatcher } from 'svelte';
	import { svelteTheme } from './theme';

	/** @type {import('./types').File | undefined} */
	export let file;

	$: value = file?.content ?? '';
	$: lang = file?.path.split('.').pop() ?? 'svelte';

	const dispatch = createEventDispatcher();
</script>

{#if file}
	<div
		use:codemirror={{
			documentId: file.id,
			value,
			lang,
			langMap: {
				svelte,
				js: javascript,
				json,
				html,
			},
			theme: svelteTheme,
			setup: 'basic',
			useTabs: true,
			tabSize: 2,
			styles: {
				'*': {
					fontFamily: 'jetbrains mono, monospace',
				},
			},
		}}
		on:codemirror:textChange={(e) => {
			value = e.detail;
			dispatch('change', e.detail);
		}}
	/>
{/if}

<style>
	div {
		height: 100%;
		width: 100%;

		font-family: 'jetbrains mono', monospace;
		font-size: 1.4rem;
	}

	div :global(.cm-editor) {
		height: 100%;
	}
</style>

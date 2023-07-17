<script>
	import { codemirror } from '@neocodemirror/svelte';
	import { svelte } from '@replit/codemirror-lang-svelte';
	import { createEventDispatcher } from 'svelte';
	import { svelteTheme } from './theme';

	/** @type {string} */
	export let value;

	const dispatch = createEventDispatcher();
</script>

<div
	use:codemirror={{
		value,
		lang: svelte(),
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

		dispatch('change', value);
	}}
/>

<style>
	div {
		height: 100%;
		width: 100%;

		font-family: 'jetbrains mono', monospace;
	}
</style>

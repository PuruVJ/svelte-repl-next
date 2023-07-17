<script>
	import { SplitPane } from '@rich_harris/svelte-split-pane';
	import { dequal } from 'dequal';
	import { writable } from 'svelte/store';
	import Editor from './Editor.svelte';
	import { files_to_tree, process_file_to_id } from './files';
	import { create_webcontainer_utils } from './webcontainer';

	/** @type {'rollup' | 'webcontainer'} */
	export let mode = 'rollup';

	/** @type {import('@webcontainer/api').WebContainer | null} */
	export let webcontainer = null;

	/** @type {import('./types').InputFile[]} */
	let internal_files;
	export { internal_files as files };

	/** @type {import('./types').ReplContext['files']} */
	const files = writable([]);

	/** @type {import('svelte/store').Writable<import('@webcontainer/api').FileSystemTree>} */
	const files_tree = writable({});

	$: {
		// Process files to add ID to each
		const identified_files = process_file_to_id(internal_files);
		// Only construct the tree if identified files is different from files_store
		if (dequal(identified_files, $files)) break $;

		$files = identified_files;

		$files_tree = files_to_tree(identified_files);
	}

	$: console.log($files_tree);

	$: is_webcontainer = mode === 'webcontainer';
	$: webcontainer_store = is_webcontainer
		? create_webcontainer_utils({ webcontainer, files: $files_tree })
		: null;

	$: $webcontainer_store?.status !== 'booting' && webcontainer_store?.install_dependencies();

	$: console.log($webcontainer_store);

	async function init_wc() {
		await webcontainer?.mount($files_tree);

		webcontainer_store?.listen();

		await webcontainer_store?.install_dependencies();

		webcontainer_store?.run_dev_server();
	}

	// When webcontainer is defined, initialize it
	$: if (webcontainer) init_wc();

	// /** @type {{ packagesUrl?: string; svelteUrl?: string; injectedJS?: string; injectedCSS?: string; }} */
	// export let rollupReplOptions = {
	// 	injectedCSS: '',
	// 	injectedJS: '',
	// 	packagesUrl: 'https://unpkg.com',
	// 	svelteUrl: 'https://unpkg.com/svelte',
	// };

	// export let orientation = 'columns';
	// export let relaxed = false;
	// export let fixed = false;
	// export let fixedPos = 50;
	// export let previewTheme = 'light';
	// export let showModified = false;
	// export let showAst = false;
	// export let autocomplete = true;
</script>

<SplitPane id="main" type="horizontal" pos="50%" min="100px" max="-4.1rem">
	<section slot="a">
		<Editor
			value={$files.find(({ path }) => path.includes('src/routes/+page.svelte'))?.content ?? ''}
			on:change={({ detail }) => {
				// Trigger webcontainers
				webcontainer?.fs.writeFile('src/routes/+page.svelte', detail);
			}}
		/>
	</section>

	<section slot="b">
		{#if $webcontainer_store?.webcontainer_url}
			<iframe src={$webcontainer_store?.webcontainer_url} title="Preview" />
		{/if}
	</section>
</SplitPane>

<style>
	iframe {
		width: 100%;
		height: 100%;
	}
</style>

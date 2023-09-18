<script>
	import { SplitPane } from '@rich_harris/svelte-split-pane';
	import { dequal } from 'dequal';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Editor from './Editor.svelte';
	import { Adapter } from './adapter';
	import { set_repl_context } from './context';
	import { files_to_tree, process_file_to_id } from './files';
	import FileTree from './filetree/FileTree.svelte';

	/** @type {'rollup' | 'webcontainer'} */
	export let mode = 'rollup';

	/** @type {import('@webcontainer/api').WebContainer | null} */
	export let webcontainer = null;

	/** @type {import('./types').InputFile[]} */
	let internal_files;
	export { internal_files as files };

	/** @type {import('./types').ReplContext['files']} */
	const files = writable([]);

	/** @type {import('./types').ReplContext['selected_id']} */
	const selected_id = writable(null);

	$: selected_path = $files.find(({ id }) => id === $selected_id)?.path ?? null;

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

	$: adapter = new Adapter();
	$: store = adapter.store;

	$: adapter.set_mode(mode);
	$: adapter.set_files($files);
	$: if (webcontainer) {
		adapter.set_webcontainer(webcontainer);
		adapter.init();
	}

	set_repl_context({ files, selected_id, adapter });

	onMount(() => {
		$selected_id =
			$files.find(({ path }) => path.includes('src/routes/+page.svelte') || path === 'App.svelte')
				?.id ?? null;
	});

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

<SplitPane id="main" type="horizontal" pos="55%" min="100px" max="-4.1rem">
	<section slot="a">
		<SplitPane id="main" type="horizontal" pos="20%" min="100px" max="-4.1rem">
			<section slot="a">
				<FileTree />
			</section>
			<section slot="b">
				<Editor
					file={$files.find(({ id }) => id === $selected_id)}
					on:change={({ detail }) => {
						// Trigger webcontainers
						if (selected_path) adapter.write_file(selected_path, detail);
					}}
				/>
			</section>
		</SplitPane>
	</section>

	<section slot="b">
		{#if $store?.iframe_url}
			<iframe src={$store.iframe_url} title="Preview" />
		{/if}
	</section>
</SplitPane>

<style>
	iframe {
		width: 100%;
		height: 100%;

		border: none;
	}
</style>

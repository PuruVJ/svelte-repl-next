<script>
	import { get_repl_context } from '$lib/context';

	const { selected_id, files } = get_repl_context();

	/** @param {import('$lib/types').File[]} files */
	function serialize_files(files) {
		/** @type {{ path: string, label: string, type: 'file' | 'directory', depth: number }[]} */
		const output = [];

		/**
		 * @param {string} path
		 * @param {number} depth
		 */
		function convertToDepthStructure(path, depth) {
			const parts = path.split('/');
			for (let i = 0; i < parts.length; i++) {
				const isFile = i === parts.length - 1;
				const label = parts[i];
				const type = isFile ? 'file' : 'directory';
				const existingItem = output.find(
					(item) => item.label === label && item.depth === depth + i
				);

				if (!existingItem) {
					output.push({
						path,
						label,
						type,
						depth: depth + i,
					});
				}
			}
		}

		files.forEach((file) => convertToDepthStructure(file.path, 0));

		return output;
	}

	$: tree_like_files = serialize_files($files);
</script>

<ul class="filetree">
	{#each tree_like_files as { label, type, depth, path }}
		<li style:padding-left="{depth * 2}rem">
			<button
				class:selected={$selected_id === $files.find((file) => file.path === path)?.id}
				on:click={() => {
					if (type === 'file') {
						// select file and show in the editor
						$selected_id = $files.find((file) => file.path === path)?.id ?? null;
					}
				}}
			>
				{label}
			</button>
		</li>
	{/each}
</ul>

<style>
	.selected {
		color: var(--sk-theme-1);
	}
</style>

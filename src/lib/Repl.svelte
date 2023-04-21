<script>
	import { SplitPane } from '@rich_harris/svelte-split-pane';
	import { createEventDispatcher, tick } from 'svelte';
	import ComponentSelector from './input/ComponentSelector.svelte';
	import ModuleEditor from './input/ModuleEditor.svelte';
	import {
		bundle,
		bundler,
		clear_state,
		compile_options,
		files,
		module_editor,
		output,
		rebundle,
		selected,
		selected_index,
		toggleable,
	} from './state';
	import Output from './output/Output.svelte';
	import { BROWSER } from 'esm-env';
	import Bundler from './Bundler';

	export let packagesUrl = 'https://unpkg.com';
	export let svelteUrl = `${packagesUrl}/svelte`;
	export let embedded = false;
	/** @type {'columns' | 'rows'} */
	export let orientation = 'columns';
	export let relaxed = false;
	export let fixed = false;
	export let fixedPos = 50;
	export let injectedJS = '';
	export let injectedCSS = '';
	// export let theme = 'svelte';
	export let showModified = false;
	export let showAst = false;

	export function toJSON() {
		return {
			imports: $bundle?.imports ?? [],
			files: $files,
		};
	}

	/**
	 * @param {{ files: import('./types').File[], css?: string }} data
	 */
	export async function set(data) {
		$files = data.files;
		$selected_index = 0;

		rebundle();

		// Wait for editors to be ready
		await tick(); // This is just a guess that it will make the editors be ready

		injectedCSS = data.css || '';

		$module_editor?.set({
			code: $selected?.source ?? '',
			lang: $selected?.type ?? 'svelte',
		});

		if ($selected) $output?.set?.($selected, $compile_options);
		clear_state();
	}

	export function markSaved() {
		$files = $files.map((val) => ({ ...val, modified: false }));

		if (!$selected) return;

		$files[$selected_index].modified = false;
	}

	/** @param {{ files: import('./types').File[], css?: string }} data */
	export function update(data) {
		if (!$selected) return;

		const { name, type } = $selected;

		$files = data.files;

		const matched_component_index = data.files.findIndex(
			(file) => file.name === name && file.type === type
		);

		$selected_index = matched_component_index === -1 ? 0 : matched_component_index;

		injectedCSS = data.css ?? '';

		if (matched_component_index) {
			$module_editor?.update({
				code: $files[matched_component_index].source,
				lang: $files[matched_component_index].type,
			});

			$output?.update?.($files[matched_component_index], $compile_options);

			$module_editor?.clearEditorState();
		}
	}

	/** @type {ReturnType<typeof createEventDispatcher<{ change: import('./types').File[] }>>} */
	const dispatch = createEventDispatcher();

	$: if ($output && $selected) {
		$output.update($selected, $compile_options);
	}

	$: mobile = width < 540;

	$: $toggleable = mobile && orientation === 'columns';

	/** @type {import('./types').StartOrEnd} */
	let sourceErrorLoc;
	let width = 0;
	let show_output = false;

	/** @type {string | null} */
	let status = null;
	let status_visible = false;

	/** @type {NodeJS.Timeout | undefined} */
	let status_timeout = undefined;

	$bundler = BROWSER
		? new Bundler({
				packages_url: packagesUrl,
				svelte_url: svelteUrl,
				onstatus: (message) => {
					if (message) {
						// show bundler status, but only after time has elapsed, to
						// prevent the banner flickering
						if (!status_visible && !status_timeout) {
							status_timeout = setTimeout(() => {
								status_visible = true;
							}, 400);
						}
					} else {
						clearTimeout(status_timeout);
						status_visible = false;
						status_timeout = undefined;
					}

					status = message;
				},
		  })
		: null;

	$: if (output && $selected) {
		$output?.update($selected, $compile_options);
	}
</script>

<!-- <svelte:window on:beforeunload={beforeUnload} /> -->

<div class="container" class:toggleable={$toggleable} bind:clientWidth={width}>
	<div class="viewport" class:output={show_output}>
		<SplitPane
			id="main"
			type={orientation === 'rows' ? 'vertical' : 'horizontal'}
			pos="{mobile || fixed ? fixedPos : orientation === 'rows' ? 60 : 50}%"
			min="100px"
			max="-4.1rem"
		>
			<section slot="a">
				<ComponentSelector show_modified={showModified} on:add on:remove />
				<ModuleEditor errorLoc={sourceErrorLoc} />
			</section>

			<section slot="b" style="height: 100%;">
				<Output
					bind:this={$output}
					{svelteUrl}
					status={status_visible ? status : null}
					{embedded}
					{relaxed}
					{injectedJS}
					{injectedCSS}
					{showAst}
				/>
			</section>
		</SplitPane>
	</div>
	<!-- {#if $selectoggleable}
		<InputOutputToggle bind:checked={show_output} />
	{/if} -->
</div>

<style>
	.container {
		position: relative;
		width: 100%;
		height: 100%;
		background: var(--sk-back-1);
	}

	.container :global(section) {
		position: relative;
		padding: 42px 0 0 0;
		height: 100%;
		box-sizing: border-box;
	}

	.container :global(section) > :global(*):first-child {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 42px;
		box-sizing: border-box;
	}

	.container :global(section) > :global(*):last-child {
		width: 100%;
		height: 100%;
	}

	.viewport {
		height: 100%;
	}

	.toggleable .viewport {
		width: 200%;
		height: calc(100% - 42px);
		transition: transform 0.3s;
	}

	.toggleable .viewport.output {
		transform: translate(-50%);
	}

	/* on mobile, override the <SplitPane> controls */
	@media (max-width: 799px) {
		:global([data-pane='main']) {
			--pos: 50% !important;
		}

		:global([data-pane='editor']) {
			--pos: 5.4rem !important;
		}

		:global([data-pane]) :global(.divider) {
			cursor: default;
		}
	}
</style>
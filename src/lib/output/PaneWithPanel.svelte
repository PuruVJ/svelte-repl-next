<script>
	import { spring } from 'svelte/motion';
	import { SplitPane } from '@rich_harris/svelte-split-pane';

	/** @type {string} */
	export let panel;

	/** @type {Exclude<import('@rich_harris/svelte-split-pane/dist/SplitPane.svelte').SplitPaneProps['max'], undefined>} */
	export let pos = '50px';

	let previous_pos = Math.min(+pos.replace('px', ''), 70);

	/** @type {Exclude<import('@rich_harris/svelte-split-pane/dist/SplitPane.svelte').SplitPaneProps['max'], undefined>} */
	let max = '0px';

	// we can't bind to the spring itself, but we
	// can still use the spring to drive `pos`
	const driver = spring(+pos.replace('px', ''), {
		stiffness: 0.2,
		damping: 0.5,
	});

	// @ts-ignore
	$: pos = $driver + 'px';

	const toggle = () => {
		const numeric_pos = +pos.replace('px', '');

		driver.set(numeric_pos, { hard: true });

		if (numeric_pos > 80) {
			driver.set(previous_pos);
		} else {
			previous_pos = numeric_pos;
			driver.set(+max.replace('px', ''));
		}
	};
</script>

<SplitPane bind:max type="vertical" bind:pos on:change={(e) => console.log(e.detail)}>
	<section slot="a">
		<slot name="main" />
	</section>

	<section slot="b">
		<div class="panel-header" on:click={toggle} on:keyup={(e) => e.key === ' ' && toggle()}>
			<h3>{panel}</h3>
			<slot name="panel-header" />
		</div>

		<div class="panel-body">
			<slot name="panel-body" />
		</div>
	</section>
</SplitPane>

<style>
	.panel-header {
		height: 42px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 0.5em;
		cursor: pointer;
	}

	.panel-body {
		overflow: auto;
	}

	h3 {
		font: 700 12px/1.5 var(--sk-font);
		color: var(--sk-text-1, #333);
	}

	section {
		overflow: hidden;
	}
</style>

<script>
	import ConsoleLine from './ConsoleLine.svelte';

	/** @type {import('./console').Log[]} */
	export let logs;
</script>

<div class="container">
	{#each logs as log}
		<ConsoleLine {log} />
	{/each}
</div>

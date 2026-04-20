<script>
	import Graph from './Graph.svelte';

	export let analysis;
</script>

<div class="result-section">
	<div class="result-label">Analysis Result</div>
	<div class="result-narrative">
		{@html analysis.narrative}
	</div>

	<div class="graph-section">
		<div class="graph-label">Causal Network (excerpt)</div>
		<Graph />
		<div class="graph-hint">Click nodes to explore relationships</div>
	</div>
</div>

<style>
	.result-section {
		animation: fadeInUp 0.6s ease forwards;
	}

	.result-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--text-secondary);
		margin-bottom: 20px;
		display: block;
		font-weight: 500;
	}

	.result-narrative {
		background: linear-gradient(135deg, rgba(230, 57, 70, 0.04), rgba(244, 164, 96, 0.02));
		border: 1px solid rgba(42, 51, 68, 0.8);
		border-left: 2px solid rgba(230, 57, 70, 0.6);
		padding: 28px;
		margin-bottom: 40px;
		line-height: 1.8;
		font-size: 13px;
		border-radius: 2px;
	}

	:global(.result-narrative strong) {
		color: rgba(244, 164, 96, 0.9);
		font-weight: 600;
	}

	.graph-section {
		margin-top: 48px;
	}

	.graph-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--text-secondary);
		margin-bottom: 20px;
		display: block;
		font-weight: 500;
	}

	.graph-hint {
		font-size: 11px;
		color: var(--text-secondary);
		margin-top: 12px;
	}
</style>

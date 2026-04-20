<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let analysis;

	function handleNewQuery() {
		dispatch('newQuery');
	}
</script>

<div class="right-panel">
	<div class="panel-section">
		<label class="panel-label">Dossier Context</label>
		<div class="metadata-item">
			<span class="metadata-label">Active:</span>
			<span class="metadata-value">{analysis.dossier}</span>
		</div>
		<div class="metadata-item">
			<span class="metadata-label">Entities:</span>
			<span class="metadata-value">{analysis.entities}</span>
		</div>
		<div class="metadata-item">
			<span class="metadata-label">Relations:</span>
			<span class="metadata-value">{analysis.relations}</span>
		</div>
		<div class="metadata-item">
			<span class="metadata-label">Events:</span>
			<span class="metadata-value">{analysis.events}</span>
		</div>
	</div>

	<div class="panel-section">
		<label class="panel-label">Source Coverage</label>
		<div class="metadata-item">
			<span class="metadata-label">Articles cited:</span>
			<span class="metadata-value">{analysis.sourcesCited}</span>
		</div>
		<div class="metadata-item">
			<span class="metadata-label">Confidence:</span>
			<span class="metadata-value">{analysis.confidence.toFixed(2)}</span>
		</div>
	</div>

	<div class="panel-section">
		<label class="panel-label">Suggested Deepens</label>
		<ul class="suggestion-list">
			<li class="suggestion-item">→ Taiwan semiconductor risk</li>
			<li class="suggestion-item">→ China leverage asymmetry</li>
			<li class="suggestion-item">→ EU industrial competitiveness</li>
			<li class="suggestion-item">→ Russian hedging play</li>
			<li class="suggestion-item">→ USD energy denominator</li>
		</ul>
	</div>

	<div class="panel-section">
		<button class="btn-secondary" on:click={handleNewQuery}>New Query</button>
		<button class="btn-secondary">Save Analysis</button>
		<button class="btn-secondary">Export</button>
	</div>
</div>

<style>
	.right-panel {
		background: linear-gradient(180deg, rgba(18, 24, 38, 0.6), rgba(15, 20, 25, 0.4));
		border-left: 1px solid rgba(42, 51, 68, 0.8);
		padding: 48px 32px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 32px;
		animation: slideInRight 0.4s ease forwards;
	}

	.panel-section {
		border-bottom: 1px solid rgba(42, 51, 68, 0.6);
		padding-bottom: 24px;
	}

	.panel-section:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.panel-label {
		font-size: 9px;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: rgba(168, 176, 190, 0.7);
		margin-bottom: 16px;
		display: block;
		font-weight: 600;
	}

	.metadata-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 12px;
		font-size: 12px;
	}

	.metadata-label {
		color: rgba(168, 176, 190, 0.6);
	}

	.metadata-value {
		color: rgba(244, 164, 96, 0.85);
		font-weight: 600;
	}

	.suggestion-list {
		list-style: none;
	}

	.suggestion-item {
		padding: 10px 0;
		color: rgba(168, 176, 190, 0.65);
		font-size: 12px;
		cursor: pointer;
		border-left: 2px solid transparent;
		padding-left: 12px;
		transition: all 0.2s ease;
		line-height: 1.5;
	}

	.suggestion-item:hover {
		color: rgba(230, 57, 70, 0.85);
		border-left-color: rgba(230, 57, 70, 0.6);
	}

	.btn-secondary {
		background: rgba(36, 45, 61, 0.6);
		border: 1px solid rgba(42, 51, 68, 0.8);
		color: var(--text-primary);
		padding: 12px 16px;
		font-family: var(--font-mono);
		font-size: 10px;
		border-radius: 2px;
		text-transform: uppercase;
		letter-spacing: 1px;
		transition: all 0.2s ease;
		width: 100%;
		margin-bottom: 10px;
		font-weight: 500;
	}

	.btn-secondary:hover {
		border-color: rgba(230, 57, 70, 0.4);
		color: rgba(230, 57, 70, 0.85);
		background: rgba(230, 57, 70, 0.05);
	}

	.btn-secondary:last-of-type {
		margin-bottom: 0;
	}
</style>

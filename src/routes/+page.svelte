<script>
	import { onMount } from 'svelte';
	import PromptBox from '../components/PromptBox.svelte';
	import ChatHistory from '../components/ChatHistory.svelte';
	import RightPanel from '../components/RightPanel.svelte';

	let messages = [];
	let rightPanelVisible = false;
	let currentAnalysis = null;
	let loading = false;

	function handleSubmit(event) {
		const query = event.detail;
		if (!query.trim()) return;

		messages = [
			...messages,
			{
				id: Date.now(),
				type: 'user',
				content: query,
				timestamp: new Date()
			}
		];

		loading = true;
		rightPanelVisible = true;

		setTimeout(() => {
			const mockAnalysis = {
				narrative: `<strong>Given state:</strong> Iran IRGC operationalizes advanced drone swarms targeting maritime commerce. Houthi affiliates escalate Red Sea disruptions. Saudi Arabia's petrochemical exports face sustained risk. U.S. naval presence constrained by political cost. Regional balance shifts toward Beijing-Moscow coordination.<br><br><strong>Cascade consequences (probability-weighted):</strong><br>• Strait of Hormuz throughput ↓ 12–18% (medium confidence)<br>• Global crude prices spike $15–25/bbl (high confidence)<br>• EU manufacturing input costs ↑ (direct transmission)<br>• China gains leverage over supply routes (structural advantage)<br>• NATO cohesion tested: Germany–Poland divergence on energy policy emerges<br>• UAE and Qatar signal hedging; Saudi Arabia delays downstream investment`,
				entities: 12,
				relations: 28,
				events: 5,
				dossier: 'Iran-Hormuz',
				confidence: 0.78,
				sourcesCited: 7
			};

			messages = [
				...messages,
				{
					id: Date.now() + 1,
					type: 'analysis',
					content: mockAnalysis,
					timestamp: new Date()
				}
			];

			currentAnalysis = mockAnalysis;
			loading = false;
		}, 800);
	}

	function handleNewQuery() {
		messages = [];
		rightPanelVisible = false;
		currentAnalysis = null;
	}
</script>

<div class="container">
	<div class="main">
		<div class="header">
			<div class="header-title">CHESS</div>
			<div class="header-subtitle">Causal History & Evolutionary Scenario System</div>
		</div>

		<ChatHistory {messages} {loading} />
		<PromptBox on:submit={handleSubmit} {loading} />
	</div>

	{#if rightPanelVisible && currentAnalysis}
		<RightPanel analysis={currentAnalysis} on:newQuery={handleNewQuery} />
	{/if}
</div>

<style>
	.container {
		display: grid;
		grid-template-columns: 1fr 380px;
		height: 100vh;
		gap: 0;
	}

	.main {
		background: var(--bg-dark);
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		padding: 48px 56px;
		overflow-y: auto;
		position: relative;
	}

	.header {
		margin-bottom: 48px;
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 24px;
		flex-shrink: 0;
	}

	.header-title {
		font-family: var(--font-display);
		font-size: 28px;
		font-weight: normal;
		margin-bottom: 8px;
		letter-spacing: -0.3px;
		text-transform: uppercase;
	}

	.header-subtitle {
		color: var(--text-secondary);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 2px;
		font-weight: 500;
	}
</style>

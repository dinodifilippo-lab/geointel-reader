<script>
	import { onMount } from 'svelte';

	let container;

	onMount(() => {
		// Graph initialization - SVG based for F1
	});
</script>

<div class="graph-container" bind:this={container}>
	<svg viewBox="0 0 800 400" class="graph-svg">
		<defs>
			<radialGradient id="grad1" cx="30%" cy="40%">
				<stop offset="0%" style="stop-color:rgba(230,57,70,0.1);stop-opacity:1" />
				<stop offset="100%" style="stop-color:rgba(230,57,70,0.02);stop-opacity:0" />
			</radialGradient>
			<radialGradient id="grad2" cx="70%" cy="60%">
				<stop offset="0%" style="stop-color:rgba(244,164,96,0.1);stop-opacity:1" />
				<stop offset="100%" style="stop-color:rgba(244,164,96,0.02);stop-opacity:0" />
			</radialGradient>
		</defs>

		<rect width="800" height="400" fill="url(#grad1)" />
		<rect width="800" height="400" fill="url(#grad2)" />

		<!-- Edges -->
		<line x1="120" y1="140" x2="280" y2="80" class="edge" />
		<line x1="120" y1="140" x2="280" y2="180" class="edge" />
		<line x1="280" y1="180" x2="400" y2="180" class="edge" />
		<line x1="400" y1="180" x2="560" y2="220" class="edge" />
		<line x1="560" y1="220" x2="680" y2="120" class="edge" />
		<line x1="280" y1="80" x2="320" y2="280" class="edge" />
		<line x1="400" y1="180" x2="320" y2="280" class="edge" />

		<!-- Nodes -->
		<g class="node" transform="translate(120, 140)">
			<circle r="18" class="node-circle" />
			<text class="node-text">Iran</text>
		</g>

		<g class="node" transform="translate(280, 80)">
			<circle r="18" class="node-circle" />
			<text class="node-text">IRGC</text>
		</g>

		<g class="node" transform="translate(280, 180)">
			<circle r="18" class="node-circle" />
			<text class="node-text">Houthi</text>
		</g>

		<g class="node" transform="translate(400, 180)">
			<circle r="18" class="node-circle" />
			<text class="node-text">Strait</text>
		</g>

		<g class="node" transform="translate(560, 220)">
			<circle r="18" class="node-circle" />
			<text class="node-text">Oil</text>
		</g>

		<g class="node" transform="translate(680, 120)">
			<circle r="18" class="node-circle" />
			<text class="node-text">EU</text>
		</g>

		<g class="node" transform="translate(320, 280)">
			<circle r="18" class="node-circle" />
			<text class="node-text">USD</text>
		</g>
	</svg>
</div>

<style>
	.graph-container {
		background: linear-gradient(135deg, rgba(18, 24, 38, 0.5), rgba(24, 32, 48, 0.3));
		border: 1px solid rgba(42, 51, 68, 0.8);
		border-radius: 2px;
		aspect-ratio: 2 / 1;
		overflow: hidden;
		margin-bottom: 16px;
	}

	.graph-svg {
		width: 100%;
		height: 100%;
	}

	.edge {
		stroke: rgba(230, 57, 70, 0.2);
		stroke-width: 1.5;
	}

	.node {
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.node:hover {
		filter: drop-shadow(0 0 8px rgba(230, 57, 70, 0.4));
	}

	.node:hover .node-circle {
		r: 22;
		fill: rgba(230, 57, 70, 0.9);
	}

	.node-circle {
		fill: rgba(230, 57, 70, 0.7);
		stroke: rgba(230, 57, 70, 0.4);
		stroke-width: 1;
		transition: all 0.2s ease;
	}

	.node-text {
		font-family: var(--font-mono);
		font-size: 8px;
		font-weight: 600;
		fill: white;
		text-anchor: middle;
		dominant-baseline: middle;
		pointer-events: none;
	}
</style>

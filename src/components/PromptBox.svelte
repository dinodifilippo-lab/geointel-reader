<script>
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let inputValue = '';
	let isSubmitting = false;

	export let loading = false;

	function handleSubmit() {
		if (inputValue.trim() && !loading) {
			dispatch('submit', inputValue);
			inputValue = '';
		}
	}

	function handleKeydown(e) {
		if (e.ctrlKey && e.key === 'Enter') {
			handleSubmit();
		}
	}

	$: isSubmitting = loading;
</script>

<div class="prompt-section">
	<label class="prompt-label">Formulate your question</label>
	<div class="prompt-input-wrapper">
		<textarea
			class="prompt-input"
			placeholder="Example: Iran weaponizes advanced drones, U.S. cannot intervene militarily. What are the cascade consequences?"
			bind:value={inputValue}
			on:keydown={handleKeydown}
			disabled={isSubmitting}
		/>
		<button class="btn-go" on:click={handleSubmit} disabled={isSubmitting}>
			{#if isSubmitting}
				<span class="spinner" />
			{:else}
				GO
			{/if}
		</button>
	</div>
	<div class="hint">Press Ctrl+Enter or click GO</div>
</div>

<style>
	.prompt-section {
		margin-bottom: 48px;
		flex-shrink: 0;
	}

	.prompt-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: var(--text-secondary);
		margin-bottom: 16px;
		display: block;
		font-weight: 500;
	}

	.prompt-input-wrapper {
		display: grid;
		grid-template-columns: 1fr 80px;
		gap: 16px;
	}

	.prompt-input {
		background: rgba(18, 24, 38, 0.6);
		border: 1px solid rgba(42, 51, 68, 0.8);
		color: var(--text-primary);
		padding: 20px;
		font-family: var(--font-mono);
		font-size: 13px;
		border-radius: 2px;
		resize: none;
		height: 100px;
		transition: all 0.3s ease;
		line-height: 1.6;
	}

	.prompt-input:focus {
		outline: none;
		border-color: rgba(230, 57, 70, 0.4);
		background: rgba(230, 57, 70, 0.02);
	}

	.prompt-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.prompt-input::placeholder {
		color: rgba(168, 176, 190, 0.5);
	}

	.btn-go {
		background: linear-gradient(135deg, rgba(230, 57, 70, 0.9), rgba(230, 57, 70, 0.7));
		border: 1px solid rgba(230, 57, 70, 0.6);
		color: white;
		padding: 20px;
		font-family: var(--font-mono);
		font-weight: 600;
		font-size: 11px;
		border-radius: 2px;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		transition: all 0.3s ease;
		align-self: flex-start;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-go:hover:not(:disabled) {
		background: linear-gradient(135deg, rgba(230, 57, 70, 1), rgba(230, 57, 70, 0.85));
		box-shadow: 0 8px 24px rgba(230, 57, 70, 0.25);
		border-color: rgba(230, 57, 70, 0.8);
	}

	.btn-go:active:not(:disabled) {
		transform: translateY(1px);
	}

	.btn-go:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		display: inline-block;
		width: 12px;
		height: 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: white;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.hint {
		font-size: 10px;
		color: rgba(168, 176, 190, 0.4);
		margin-top: 8px;
		letter-spacing: 0.5px;
	}
</style>

<script>
	import ResultMessage from './ResultMessage.svelte';
	let container;

	export let messages = [];
	export let loading = false;

	function scrollToBottom() {
		if (container) {
			setTimeout(() => {
				container.scrollTop = container.scrollHeight;
			}, 0);
		}
	}

	$: messages, scrollToBottom();
</script>

<div class="chat-container" bind:this={container}>
	{#if messages.length === 0}
		<div class="empty-state">
			<div class="empty-icon">→</div>
			<p>Submit a query to begin analysis</p>
		</div>
	{/if}

	{#each messages as message (message.id)}
		{#if message.type === 'user'}
			<div class="message user-message">
				<div class="message-content">{message.content}</div>
				<div class="message-time">{message.timestamp.toLocaleTimeString([], {
					hour: '2-digit',
					minute: '2-digit'
				})}</div>
			</div>
		{:else if message.type === 'analysis'}
			<ResultMessage analysis={message.content} />
		{/if}
	{/each}

	{#if loading}
		<div class="message loading-message">
			<div class="spinner" />
			<span>Analyzing...</span>
		</div>
	{/if}
</div>

<style>
	.chat-container {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 32px;
		padding-bottom: 32px;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--text-secondary);
		text-align: center;
	}

	.empty-icon {
		font-size: 48px;
		margin-bottom: 16px;
		opacity: 0.5;
	}

	.message {
		animation: fadeInUp 0.6s ease forwards;
	}

	.user-message {
		background: linear-gradient(135deg, rgba(230, 57, 70, 0.04), rgba(244, 164, 96, 0.02));
		border: 1px solid rgba(42, 51, 68, 0.8);
		border-left: 2px solid rgba(230, 57, 70, 0.6);
		padding: 20px;
		border-radius: 2px;
		margin-left: 40px;
	}

	.message-content {
		font-size: 13px;
		line-height: 1.8;
		margin-bottom: 8px;
	}

	.message-time {
		font-size: 10px;
		color: var(--text-secondary);
		opacity: 0.6;
	}

	.loading-message {
		display: flex;
		align-items: center;
		gap: 12px;
		color: var(--text-secondary);
		font-size: 12px;
	}

	.spinner {
		display: inline-block;
		width: 12px;
		height: 12px;
		border: 2px solid rgba(230, 57, 70, 0.3);
		border-radius: 50%;
		border-top-color: var(--accent-red);
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>

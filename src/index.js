export default {
	async fetch(request, env, ctx) {
		sendMessage('Hi!', env);
		return new Response('I Send you hi!');
	},
};

async function sendMessage(message, env) {
	const response = await fetch('https://api.telegram.org/bot' + env.ENV_BOT_TOKEN + '/sendMessage', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: env.ENV_BOT_CHATID,
			text: message.toString().substring(0, 4096),
		}),
	});
}

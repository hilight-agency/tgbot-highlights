export default {
  async fetch(request, env, ctx) {
    async function gatherResponse(response) {
      const { headers } = response
      const contentType = headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        return { contentType, result: JSON.stringify(await response.json()) }
      }
      return { contentType, result: response.text() }
    }

    async function sendMessage(body) {
      console.log(body)
      return await fetch('https://api.telegram.org/bot' + env.ENV_BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.ENV_BOT_CHATID,
          text: 'asd'.substring(0, 4096),
        }),
      })
    }

    if (request.method === 'POST' && request.url.indexOf('resend') !== -1) {
      const resp = await sendMessage(request.body)
      const { contentType, result } = await gatherResponse(resp)
      const options = { headers: { 'content-type': contentType } }
      return new Response(result, options)
    } else {
      return new Response('Nothing here')
    }
  },
}

export default {
  async fetch(request, env, ctx) {
    /** CORS headers */
    const corsHeaders = {
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Accept',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
    }
    /** Working with response */
    async function gatherResponse(response) {
      const { headers } = response
      const contentType = headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        return { contentType, result: JSON.stringify(await response.json()) }
      }
      return { contentType, result: response.text() }
    }
    /**
     * Sends message to Telegram
     * @param {FormData} body
     * @returns {Promise} Promise with result of fetch to telegram api
     */
    async function sendMessage(body) {
      let msg = ''
      for (const pair of body.entries()) {
        msg += pair[0] + ' ' + pair[1] + '\n'
      }
      return await fetch('https://api.telegram.org/bot' + env.ENV_BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.ENV_BOT_CHATID,
          text: msg.substring(0, 4096),
        }),
      })
    }

    /** Main code */
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      })
    } else if (request.method === 'POST' && request.url.indexOf('resend') !== -1) {
      const readbody = new Response(request.body, { headers: request.headers })
      const formdata = await readbody.formData()
      const resp = await sendMessage(formdata)
      const { contentType, result } = await gatherResponse(resp)
      const options = { headers: { 'content-type': contentType, ...corsHeaders } }
      return new Response(result, options)
    } else {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      })
    }
  },
}

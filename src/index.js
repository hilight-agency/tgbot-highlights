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
        msg += pair[0] !== `cf-turnstile-response` ? pair[0] + ' ' + pair[1] + '\n' : ''
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
    /** turnstile validation */
    async function handlePost(request) {
      const readbody = new Response(request.body, { headers: request.headers })
      const formdata = await readbody.formData()
      // Turnstile injects a token in "cf-turnstile-response".
      const token = formdata.get('cf-turnstile-response')
      const ip = request.headers.get('CF-Connecting-IP')
      // Validate the token by calling the
      // "/siteverify" API endpoint.
      let formData = new FormData()
      formData.append('secret', env.TURNSTILE_SECRET_KEY)
      formData.append('response', token)
      formData.append('remoteip', ip)

      const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
      const result = await fetch(url, {
        body: formData,
        method: 'POST',
      })

      const outcome = await result.json()
      if (outcome.success) {
        const resp = await sendMessage(formdata)
        const { contentType, result } = await gatherResponse(resp)
        const options = { headers: { 'content-type': contentType, ...corsHeaders } }
        return new Response(result, options)
      } else {
        return new Response('Not valid token', {
          status: 405,
          headers: corsHeaders,
        })
      }
    }

    /** Main code */
    if (request.method === 'OPTIONS') {
      return new Response('OK', {
        headers: corsHeaders,
      })
    } else if (request.method === 'POST' && request.url.indexOf('resend') !== -1) {
      return await handlePost(request, sendMessage)
    } else {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders,
      })
    }
  },
}

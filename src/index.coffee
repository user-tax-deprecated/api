> ./mod.js > sleep ENV
  ./conf.js > DEBUG
  ./url/MAP.js

{API_PORT} = ENV
{serveHttp} = Deno

console.log "listen port #{API_PORT}"

server = Deno.listen({ port: parseInt(API_PORT) })

HEADERS = {
  'Access-Control-Allow-Origin':'*'
  'Access-Control-Allow-Headers':'*'
}

if DEBUG
  HEADERS['Access-Control-Allow-Private-Network'] = true

response = (status, body)=>
  new Response(
    body
    {
      status
      headers:HEADERS
    }
  )

_serveHttp = ({request:req, respondWith})=>
  {headers, method, url} = req
  if method == 'OPTIONS'
    code = 200
    body = ''
  else
    {pathname} = new URL url
    content_type = req.headers.get 'content-type'
    isJSON = (not content_type) or content_type.endsWith 'json' or content_type.startsWith 'text/'
    if isJSON
      try
        text = await req.text()
        if text
          r = JSON.parse(text)
      catch err
        respondWith(response(500,"#{text} NOT JSON\n"))
        return
      path = pathname[1..]

      if path
        li = MAP
        for i from path.split('.')
          li = li.get(i)
          if not li
            break

      if li
        func = li[0]
        try
          if r
            if Array.isArray r
              body = func(...r)
            else
              body = func(r)
          else
            body = func()
          body = await body
          for f from li[1]
            body = f body
          code = 200
        catch err
          [
            path
            r
            err
          ].map (e)=>
            console.error(e)
            return
          code = 500
          body = err
      else
        code = 404
        body = "#{path} not exist"
    else
      code = 404
      body = "Content-Type #{content_type} Not Support"
  respondWith(response(code,body))
  return


serve = (conn)=>
  for await req from serveHttp conn
    _serveHttp req
  return

loop
  for await conn from server
    serve conn

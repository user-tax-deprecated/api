> ../mod.js > connect ENV

{
  REDIS_HOST:hostname
  REDIS_PORT:port
  REDIS_PASSWORD
  REDIS_DB
} = ENV

R = await connect({ hostname, port })

await R.auth REDIS_PASSWORD

REDIS_DB = parseInt REDIS_DB
if REDIS_DB
  await R.select REDIS_DB

export default R

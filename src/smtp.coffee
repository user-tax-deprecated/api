> ./mod.js > SMTPClient ENV parseBool

{
  SMTP_HOST
  SMTP_PORT
  SMTP_TLS
  SMTP_USERNAME
  SMTP_PASSWORD
} = ENV

conn = new SMTPClient({
  connection: {
    hostname: SMTP_HOST
    port: parseInt SMTP_PORT
    tls: parseBool SMTP_TLS
    auth: {
      username: SMTP_USERNAME
      password: SMTP_PASSWORD
    }
  }
})

###
await conn.send({
  from: "i@user.tax"
  to: "i.user.tax@gmail.com"
  subject: "test vstmp"
  content: "123"
  html: "<p>456</p>"
})
###

console.log conn.close

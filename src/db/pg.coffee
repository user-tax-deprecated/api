> ../mod.js > Pool ENV

LI = "DB HOST PORT PASSWORD USER POOL_CONN".split(' ')

< (prefix, conn)=>
  [database, hostname, port, password,  user, conn] = LI.map (i)=>ENV[prefix+i]

  pool = new Pool(
    {
      database
      hostname
      password
      port
      user
    }
    parseInt conn
    true
  )

  q = (sql, args...)=>
    c = await pool.connect()
    try
      r = await c.queryArray(sql, args)
    finally
      c.release()
    r.rows

  [
    q
    (args...)=>
      r = []
      for i from await q(...args)
        r.push i[0]
      r
  ]


> ../lib/url/MAP.js

dump = (o, root)=>
  for [k,v] from o.entries()
    if Array.isArray v
      console.log root+k,v[0].toString()
    else
      dump v, root+k+'.'
  return

dump MAP, ''

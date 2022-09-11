> ./json.js

obj2map = (obj, chain)=>
  map = new Map
  for [k,v] from Object.entries obj
    map.set k, if v instanceof Function then [v,chain] else obj2map(v,chain)
  map

export default obj2map json, [
  (o)=>
    if o != undefined then JSON.stringify(o) else ''
]

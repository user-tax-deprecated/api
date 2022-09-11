#!/usr/bin/env coffee

> ../db/Q.js > Q Q0
  ../db/R.js

< {
sign:
  mail: (account, password, signUp)=>
    console.log 'mail signUp'
    [account, password]
    Q0 "select schema_name from information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')"
  phone: (area, phone, password, signUp)=>
    console.log 'phone ', signUp
    [area, phone, password, signUp]
}

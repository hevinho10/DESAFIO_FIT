#!/bin/sh
# troca a versão em todos os lugares de uma vez: ./versao.sh 20261241
[ -z "$1" ] && { echo "uso: ./versao.sh NUMERO"; exit 1; }
sed -i -E "s/(app\.min\.js|styles\.css)\?v=[0-9]+/\1?v=$1/g" index.html
sed -i -E "s/^const APP_VERSAO = '[0-9]+';/const APP_VERSAO = '$1';/" app.js
sed -i -E "s/^const V = '[0-9]+';/const V = '$1';/" sw.js
N=$(grep -oE "pulso-v[0-9]+" sw.js | head -1 | grep -oE "[0-9]+"); sed -i "s/pulso-v$N'/pulso-v$((N+1))'/" sw.js
grep -oE "\?v=[0-9]+" index.html | sort -u; grep -E "^const (APP_VERSAO|V|CACHE) =" app.js sw.js

# Sets up a temporary Geth private network
geth init --datadir ./geth/data ./geth/genesis.json &>/dev/null
geth --datadir ./geth/data --nodiscover --port 30304 --networkid 224525 --http --http.port 8546 --allow-insecure-unlock --unlock 0xc6D5a3c98EC9073B54FA0969957Bd582e8D874bf --password ./geth/password --mine &>/dev/null &

# Runs the tests
yarn jest

# Kills Geth and removes the network data
kill %1
rm -rf ./geth/data/geth

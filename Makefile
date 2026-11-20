# ─── Database identifiers ────────────────────────────────────────────────────
CONTAINER_NAME := Moludb
DB_USER        := molu
DB_PASSWORD    ?= incorrect

# Wallet / Custody DB
WALLET_DB_NAME  := bitsilo
WALLET_DB_URL   := "postgresql://$(DB_USER):$(DB_PASSWORD)@localhost:5432/$(WALLET_DB_NAME)?sslmode=disable"
WALLET_MIG_DIR  := shared/db/migration/wallet

# Trading DB
TRADING_DB_NAME := bitsilo_trading
TRADING_DB_URL  := "postgresql://$(DB_USER):$(DB_PASSWORD)@localhost:5432/$(TRADING_DB_NAME)?sslmode=disable"
TRADING_MIG_DIR := shared/db/migration/trading

# Backup helpers
NOW                   := $(shell date +%Y%m%d_%H%M%S)
BACKUP_NAME           := backup_$(NOW).dump
CONTAINER_BACKUP_PATH := /tmp/$(BACKUP_NAME)
HOST_BACKUP_DIR       := ./db_backups
RESTORE_FILE          ?= latest.dump


# gateway DB
GATEWAY_DB_NAME := bitsilo_gateway
GATEWAY_DB_URL  := "postgresql://$(DB_USER):$(DB_PASSWORD)@localhost:5432/$(GATEWAY_DB_NAME)?sslmode=disable"
GATEWAY_MIG_DIR := shared/db/migration/gateway

# ─── Wallet DB targets ───────────────────────────────────────────────────────
createdb:
	docker exec -it $(CONTAINER_NAME) \
		createdb --username=$(DB_USER) --owner=$(DB_USER) $(WALLET_DB_NAME)

dropdb:
	docker exec -it $(CONTAINER_NAME) \
		dropdb -U $(DB_USER) $(WALLET_DB_NAME)

migrateup:
	migrate -path $(WALLET_MIG_DIR) \
		-database $(WALLET_DB_URL) \
		-verbose up

migratedown:
	migrate -path $(WALLET_MIG_DIR) \
		-database $(WALLET_DB_URL) \
		-verbose down

add_migration:
	migrate create -ext sql -dir $(WALLET_MIG_DIR) -seq $(name)

gateway_migration:
	migrate create -ext sql -dir $(GATEWAY_MIG_DIR) -seq $(name)
# ─── Trading DB targets ──────────────────────────────────────────────────────
createdb_trading:
	docker exec -it $(CONTAINER_NAME) \
		createdb --username=$(DB_USER) --owner=$(DB_USER) $(TRADING_DB_NAME)

dropdb_trading:
	docker exec -it $(CONTAINER_NAME) \
		dropdb -U $(DB_USER) $(TRADING_DB_NAME)

migrateup_trading:
	migrate -path $(TRADING_MIG_DIR) \
		-database $(TRADING_DB_URL) \
		-verbose up

migratedown_trading:
	migrate -path $(TRADING_MIG_DIR) \
		-database $(TRADING_DB_URL) \
		-verbose down

add_migration_trading:
	migrate create -ext sql -dir $(TRADING_MIG_DIR) -seq $(name)

# ─── Migrate both DBs at once ────────────────────────────────────────────────
migrateup_all: migrateup migrateup_trading

migratedown_all: migratedown migratedown_trading

# ─── SQLC code generation ────────────────────────────────────────────────────
sqlc:
	sqlc generate

# ─── Build targets ───────────────────────────────────────────────────────────
build_plugin:
	mkdir -p vault/plugins
	cd vault-plugin && go build -o ../vault/plugins/vault-plugin .

build_wallet:
	cd wallet && go build -o ../bin/wallet cmd/wallet/main.go

build_monitor:
	cd monitor && go build -o ../bin/monitor cmd/monitor/main.go

build_sweeper:
	go build -o bin/sweeper cmd/sweeper/main.go

build_signtx:
	mkdir -p bin
	cd signer && go build -o ../bin/signtx ./cmd

build_admin:
	go build -o bin/admin cmd/admin/main.go

build_broadcaster:
	cd broadcaster && go build -o ../bin/broadcaster cmd/main.go

build_all: build_plugin build_wallet build_monitor build_sweeper build_signtx build_admin build_broadcaster

tx_builder:
	cd txbuilder/cmd && go run main.go

txbuilder: tx_builder

# ─── Tests ───────────────────────────────────────────────────────────────────
test:
	go test -v ./...

# ─── Vault ───────────────────────────────────────────────────────────────────
vault_up:
	./scripts/vault_prod.sh

vault_down:
	killall vault 2>/dev/null || true

# ─── Docker build targets ────────────────────────────────────────────────────
docker_build_wallet:
	docker build -f wallet/Dockerfile.wallet -t bitsilo-app .

docker_build_monitor:
	docker build -f monitor/Dockerfile -t bitsilo-monitor .

docker_build_signer:
	docker build -f signer/Dockerfile -t bitsilo-signer .

docker_build_settletx:
	docker build -f settletx/Dockerfile -t bitsilo-settletx .

docker_build_txbuilder:
	docker build -f txbuilder/Dockerfile -t bitsilo-txbuilder .

docker_build_admin:
	docker build -f admin/admin/Dockerfile -t bitsilo-admin .

docker_build_frontend:
	cd wallet/frontend && docker build -t bitsilo-user .

docker_build_all: docker_build_wallet docker_build_monitor docker_build_signer docker_build_settletx docker_build_txbuilder \
	#docker_build_admin docker_build_frontend

# ─── Run targets ─────────────────────────────────────────────────────────────
serve:
	cd wallet/cmd && go run . 

monitor:
	cd monitor && go run cmd/main.go $(if $(CHAIN),--chains $(CHAIN),$(if $(chain),--chains $(chain),))

monitor_all: build_monitor
	cd monitor && go run cmd/main.go --chains ethereum,bsc,tron,solana,bitcoin,litecoin,dogecoin,dash,bitcoincash,ripple

settle:
	cd settletx/cmd && go run main.go

deploy_evm:
	cd contract/evm && go run script/deploy_vault.go

deploy_tron:
	cd contract/tron && go run script/deploy_vault.go

# ─── Infrastructure ──────────────────────────────────────────────────────────
Init:
	docker start Moludb bitsilo-redis
	docker compose -f /home/molu/kafka-docker/docker-compose.yml up -d

stop:
	docker stop Moludb bitsilo-redis
	docker compose -f /home/molu/kafka-docker/docker-compose.yml down

start:
	docker start $(CONTAINER_NAME)

host_frontend:
	cd frontend && yarn dev -H 0.0.0.0 -p 3000

up:
	docker compose -f /home/molu/go/src/github/Molu/bitsilo/nodemanager/docker-compose.yml up -d btc bch doge ltc dash miner

down:
	docker compose -f /home/molu/go/src/github/Molu/bitsilo/nodemanager/docker-compose.yml --profile "*" down --remove-orphans

utxos:
	cd monitor/cmd && go run main.go --chains bitcoin,litecoin,dogecoin,dash,bitcoincash

frontend:
	cd wallet && cd frontend && yarn dev

dash_up:
	docker compose -f nodemanager/docker-compose.yml up -d dash

dash_setup:
	./nodemanager/scripts/setup_dash_instantsend.sh

dash_down:
	docker compose -f nodemanager/docker-compose.yml --profile instantsend stop dash dash-mn1 dash-mn2 dash-mn3

dash_reset: dash_down
	docker compose -f nodemanager/docker-compose.yml --profile instantsend rm -fsv dash-mn1 dash-mn2 dash-mn3 dash || true
	docker volume rm -f nodemanager_dash-data nodemanager_dash-mn1-data nodemanager_dash-mn2-data nodemanager_dash-mn3-data || true
	# Reset BLS secret placeholders so next dash_setup generates fresh keys
	sed -i 's/^masternodeblsprivkey=.*/masternodeblsprivkey=REPLACE_BLS_SECRET_1/' nodemanager/config/dash/mn1.conf
	sed -i '/^# blspubkey=/d' nodemanager/config/dash/mn1.conf
	sed -i 's/^masternodeblsprivkey=.*/masternodeblsprivkey=REPLACE_BLS_SECRET_2/' nodemanager/config/dash/mn2.conf
	sed -i '/^# blspubkey=/d' nodemanager/config/dash/mn2.conf
	sed -i 's/^masternodeblsprivkey=.*/masternodeblsprivkey=REPLACE_BLS_SECRET_3/' nodemanager/config/dash/mn3.conf
	sed -i '/^# blspubkey=/d' nodemanager/config/dash/mn3.conf
	# Clear spork key so next dash_setup generates a fresh one for the new chain
	sed -i '/^sporkaddr=/d' nodemanager/config/dash/miner.conf
	sed -i '/^sporkkey=/d' nodemanager/config/dash/miner.conf
	sed -i '/^minsporkkeys=/d' nodemanager/config/dash/miner.conf
	sed -i '/^sporkaddr=/d' nodemanager/config/dash/mn1.conf nodemanager/config/dash/mn2.conf nodemanager/config/dash/mn3.conf
	sed -i '/^minsporkkeys=/d' nodemanager/config/dash/mn1.conf nodemanager/config/dash/mn2.conf nodemanager/config/dash/mn3.conf

dash_instantsend:
	docker compose -f nodemanager/docker-compose.yml --profile instantsend up -d dash dash-mn1 dash-mn2 dash-mn3 miner
	$(MAKE) dash_setup

dash_instandsend: dash_instantsend
dash-instantsend: dash_instantsend
dash-instandsend: dash_instantsend

# ─── Testnet Mocks (ETH, BSC, TRON, Solana) ──────────────────────────────────

# Ethereum Sepolia Testnet
eth_transfer:
	cd eth-testnet-mint && TOKEN=$(TOKEN) TO=$(TO) AMOUNT=$(AMOUNT) yarn transfer

eth_balance:
	cd eth-testnet-mint && ADDRESS=$(ADDRESS) yarn balance

eth_tx:
	cd eth-testnet-mint && TX=$(TX) yarn tx

eth_mint:
	cd eth-testnet-mint && MINT_TO=$(MINT_TO) MINT_AMOUNT=$(MINT_AMOUNT) yarn mint

# BSC Testnet
bsc_transfer:
	cd bsc-testnet-mint && TOKEN=$(TOKEN) TO=$(TO) AMOUNT=$(AMOUNT) yarn transfer

bsc_balance:
	cd bsc-testnet-mint && ADDRESS=$(ADDRESS) yarn balance

bsc_tx:
	cd bsc-testnet-mint && TX=$(TX) yarn tx

bsc_mint:
	cd bsc-testnet-mint && MINT_TO=$(MINT_TO) MINT_AMOUNT=$(MINT_AMOUNT) yarn mint

# TRON Testnet (Nile/Shasta)
tron_transfer:
	cd tron-testnet-mocks && TO=$(TO) AMOUNT=$(AMOUNT) yarn transfer

tron_balance:
	cd tron-testnet-mocks && ADDRESS=$(ADDRESS) yarn balance

tron_tx:
	cd tron-testnet-mocks && TX=$(TX) yarn tx

tron_mint:
	cd tron-testnet-mocks && MINT_TO=$(MINT_TO) MINT_AMOUNT=$(MINT_AMOUNT) yarn mint

# Solana Devnet
solana_transfer:
	cd solana-testnet-mocks && TOKEN=$(TOKEN) TO=$(TO) AMOUNT=$(AMOUNT) yarn transfer

solana_balance:
	cd solana-testnet-mocks && ADDRESS=$(ADDRESS) yarn balance

solana_tx:
	cd solana-testnet-mocks && TX=$(TX) yarn tx

solana_mint:
	cd solana-testnet-mocks && MINT_TO=$(MINT_TO) MINT_AMOUNT=$(MINT_AMOUNT) yarn mint

# Hyphenated & status aliases
eth-transfer: eth_transfer
eth-balance: eth_balance
eth-tx: eth_tx
eth_status: eth_tx
eth-status: eth_tx

bsc-transfer: bsc_transfer
bsc-balance: bsc_balance
bsc-tx: bsc_tx
bsc_status: bsc_tx
bsc-status: bsc_tx

tron-transfer: tron_transfer
tron-balance: tron_balance
tron-tx: tron_tx
tron_status: tron_tx
tron-status: tron_tx

solana-transfer: solana_transfer
solana-balance: solana_balance
solana-tx: solana_tx
solana_status: solana_tx
solana-status: solana_tx

feepayer:
	cd wallet/cmd && go run . --feepayer

consolidate:
	cd wallet/cmd && go run . --consolidate

consolidate-accounts: consolidate
sweep: consolidate

tx_signer:
	cd signer/cmd && go run main.go

signer: tx_signer

tx_publisher:
	cd broadcaster/cmd && go run main.go

tx_broadcaster: tx_publisher
broadcaster: tx_publisher














LITHIC_API_KEY ?=5c12e1a4-4a1c-4be9-8cab-3f7f2709fec7
PAN            ?=
TOKEN          ?=
AMOUNT         ?=
DESCRIPTOR     ?= TEST MERCHANT
VOID_TYPE      ?= AUTHORIZATION_REVERSAL
BASE           := https://sandbox.lithic.com/v1/simulate

CURL = curl -s -X POST -H "Authorization: $(LITHIC_API_KEY)" \
       -H "Content-Type: application/json"

require = $(if $($(1)),,$(error $(1) is required, e.g. make $@ $(1)=...))


authorize:
	$(call require,PAN)
	$(CURL) $(BASE)/authorize \
	  -d '{"pan":"$(PAN)","amount":$(if $(AMOUNT),$(AMOUNT),1000),"descriptor":"$(DESCRIPTOR)"}'

# Full clearing: no amount sent, so the full authorized amount clears
clearing:
	$(call require,TOKEN)
	$(CURL) $(BASE)/clearing -d '{"token":"$(TOKEN)"}'

# Partial clearing: AMOUNT is required. Run again for more clearings.
clearing-partial:
	$(call require,TOKEN)
	$(call require,AMOUNT)
	$(CURL) $(BASE)/clearing -d '{"token":"$(TOKEN)","amount":$(AMOUNT)}'

void:
	$(call require,TOKEN)
	$(CURL) $(BASE)/void \
	  -d '{"token":"$(TOKEN)","amount":$(if $(AMOUNT),$(AMOUNT),1000),"type":"$(VOID_TYPE)"}'

# Refund (return) with the default amount of 1000
refund return:
	$(call require,PAN)
	$(CURL) $(BASE)/return \
	  -d '{"pan":"$(PAN)","amount":$(if $(AMOUNT),$(AMOUNT),1000),"descriptor":"$(DESCRIPTOR)"}'

# Partial refund: AMOUNT is required. Run again for more refunds.
refund-partial:
	$(call require,PAN)
	$(call require,AMOUNT)
	$(CURL) $(BASE)/return \
	  -d '{"pan":"$(PAN)","amount":$(AMOUNT),"descriptor":"$(DESCRIPTOR)"}'

return-reversal:
	$(call require,TOKEN)
	$(CURL) $(BASE)/return_reversal -d '{"token":"$(TOKEN)"}'

credit-advice:
	$(call require,PAN)
	$(CURL) $(BASE)/credit_authorization_advice \
	  -d '{"pan":"$(PAN)","amount":$(if $(AMOUNT),$(AMOUNT),1000),"descriptor":"$(DESCRIPTOR)"}'


# ─── Phony targets ───────────────────────────────────────────────────────────
.PHONY: \
	sqlc \
	createdb dropdb migrateup migratedown add_migration \
	createdb_trading dropdb_trading migrateup_trading migratedown_trading add_migration_trading \
	migrateup_all migratedown_all \
	build_plugin build_wallet build_monitor build_sweeper build_signtx build_admin build_broadcaster build_all \
	test \
	vault_up vault_down \
	docker_build_wallet docker_build_monitor docker_build_signer docker_build_settletx docker_build_txbuilder \
	docker_build_admin docker_build_frontend docker_build_all \
	serve monitor monitor_all settle deploy_evm deploy_tron \
	Init start host_frontend utxos frontend gateway_migration \
	dash_up dash_setup dash_down dash_instantsend dash_reset \
	eth_transfer eth_balance eth_tx eth_mint eth-transfer eth-balance eth-tx eth_status eth-status \
	bsc_transfer bsc_balance bsc_tx bsc_mint bsc-transfer bsc-balance bsc-tx bsc_status bsc-status \
	tron_transfer tron_balance tron_tx tron_mint tron-transfer tron-balance tron-tx tron_status tron-status \
	solana_transfer solana_balance solana_tx solana_mint solana-transfer solana-balance solana-tx solana_status solana-status feepayer consolidate consolidate-accounts sweep \
	tx_builder txbuilder tx_signer signer tx_publisher authorize clearing clearing-partial void return refund \
        refund-partial return-reversal credit-advice




## FORCE_REBUILD=true ./scripts/vault_prod.sh
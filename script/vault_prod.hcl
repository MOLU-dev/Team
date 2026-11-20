storage "raft" {
  path    = "./vault/data"
  node_id = "node1"
}

listener "tcp" {
  address     = "127.0.0.1:8200"
  tls_disable = "1"
}

api_addr     = "http://127.0.0.1:8200"
cluster_addr = "http://127.0.0.1:8201"

plugin_directory = "/home/molu/go/src/github/Molu/bitsilo/vault/plugins"
ui               = true
disable_mlock    = true

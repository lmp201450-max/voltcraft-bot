
server {
  tls {
    names = ["voice.YOURDOMAIN.com"]

    acme {
      email = "YOUR_EMAIL"
      provider = "cloudflare"
      api_token = "${env.CF_API_TOKEN}"
    }
  }

  minecraft {
    access_token = "${env.BVC_ACCESS_TOKEN}"
  }

  bedrock {
    servers = [
      {
        name = "My Countries Server"
        host = "YOUR_POWERUPSTACK_ADDRESS"
        port = 19132
        addon_mode = "no_net"
      }
    ]
  }
}

# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :bug_free_carnival,
  ecto_repos: [BugFreeCarnival.Repo]

# Configures the endpoint
config :bug_free_carnival, BugFreeCarnivalWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "ToDAUKFZ83rS6FRe01B6yep2POf6LcFqjDFLR96N4CpDmlQ0EpzYJb1dl2UN1I8p",
  render_errors: [view: BugFreeCarnivalWeb.ErrorView, accepts: ~w(html json)],
  pubsub: [name: BugFreeCarnival.PubSub, adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"

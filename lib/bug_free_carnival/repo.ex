defmodule BugFreeCarnival.Repo do
  use Ecto.Repo,
    otp_app: :bug_free_carnival,
    adapter: Ecto.Adapters.Postgres
end

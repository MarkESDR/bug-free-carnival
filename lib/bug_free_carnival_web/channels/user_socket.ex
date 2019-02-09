defmodule BugFreeCarnivalWeb.UserSocket do
  use Phoenix.Socket

  channel "call", BugFreeCarnivalWeb.CallChannel

  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  # Returning `nil` makes this socket anonymous.
  def id(_socket), do: nil
end

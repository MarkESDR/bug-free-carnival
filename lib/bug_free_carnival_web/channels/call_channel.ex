defmodule BugFreeCarnivalWeb.CallChannel do
  use Phoenix.Channel

  def join("call", %{"name" => name}, socket) do
    send(self, :after_join)
    {:ok, assign(socket, :name, name)}
  end

  def handle_info(:after_join, socket) do
    broadcast(socket, "new_user", %{name: socket.assigns.name})
    {:noreply, socket}
  end

  def handle_in("message", message, socket) do
    broadcast!(socket, "message", message)
    {:noreply, socket}
  end

  def handle_in("prev_user", params, socket) do
    params = Map.take(params, ["name", "target"])
    broadcast!(socket, "prev_user", params)
    {:noreply, socket}
  end
end

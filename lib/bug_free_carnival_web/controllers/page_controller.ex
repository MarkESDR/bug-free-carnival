defmodule BugFreeCarnivalWeb.PageController do
  use BugFreeCarnivalWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end

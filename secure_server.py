"""Local static server that blocks hidden files/folders such as .git."""

from __future__ import annotations

from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


class SafeStaticHandler(SimpleHTTPRequestHandler):
    """Serve files while denying dot-path traversal and hidden paths."""

    def _requested_path(self) -> Path:
        raw_path = unquote(urlsplit(self.path).path)
        return Path(raw_path)

    def _has_hidden_segment(self, path: Path) -> bool:
        return any(part.startswith('.') for part in path.parts if part not in ('', '/', '.'))

    def send_head(self):  # noqa: D401 - inherited behavior with filtering
        request_path = self._requested_path()
        if self._has_hidden_segment(request_path):
            self.send_error(HTTPStatus.FORBIDDEN, "Hidden paths are not served")
            return None
        return super().send_head()


def run(port: int = 4173) -> None:
    server = ThreadingHTTPServer(("0.0.0.0", port), SafeStaticHandler)
    print(f"Serving safely on http://0.0.0.0:{port} (hidden paths blocked)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    run()

import importlib


def test_main_can_import_and_run(monkeypatch):
    # Import the module (this only defines main, doesn't start server)
    mod = importlib.import_module("sacro.__main__")

    # Patch uvicorn.run used in main to avoid binding to a socket
    monkeypatch.setattr(mod.uvicorn, "run", lambda *a, **k: None)

    # ensure main() returns/does not raise
    mod.main()

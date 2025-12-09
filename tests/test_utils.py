from sacro import utils


def test_reverse_with_params(monkeypatch):
    # create a dummy reverse to ensure params appended
    monkeypatch.setattr("sacro.utils.reverse", lambda *a, **k: "/test/url")

    result = utils.reverse_with_params({"a": 1, "b": "x"}, "name")
    assert result.startswith("/test/url?")
    assert "a=1" in result
    assert "b=x" in result

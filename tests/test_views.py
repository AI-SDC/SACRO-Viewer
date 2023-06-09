from django.test import RequestFactory

from sacro import views


def test_index(tmp_path):
    foo = tmp_path / "foo"
    bar = tmp_path / "bar"
    foo.touch()
    bar.touch()

    request = RequestFactory().get(path="/", data={"path": str(tmp_path)})

    response = views.index(request)
    assert response.context_data["files"] == [str(bar), str(foo)]

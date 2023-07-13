from sacro.errors import (
    bad_request,
    csrf_failure,
    error,
    page_not_found,
    permission_denied,
    server_error,
)


def test_bad_request(rf):
    request = rf.get("/")

    response = bad_request(request)

    assert response.status_code == 400


def test_csrf_failure(rf):
    request = rf.get("/")

    response = csrf_failure(request)

    assert response.status_code == 400


def test_error_with_message(rf):
    request = rf.get("/")

    response = error(request, message="testing")

    assert response.status_code == 500
    assert "testing" in response.rendered_content


def test_permission_denied(rf):
    request = rf.get("/")

    response = permission_denied(request)

    assert response.status_code == 403


def test_page_not_found(rf):
    request = rf.get("/")

    response = page_not_found(request)

    assert response.status_code == 404


def test_server_error(rf):
    request = rf.get("/")

    response = server_error(request)

    assert response.status_code == 500

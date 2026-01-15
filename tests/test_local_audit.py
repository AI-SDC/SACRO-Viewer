from structlog.testing import capture_logs

from sacro.adapters import local_audit


def test_log_release_logs_all_files_with_comments():
    review = {
        "file1": {"state": True, "comment": "comment 1"},
        "file2": {"state": False, "comment": "comment 2"},
    }

    with capture_logs() as logs:
        local_audit.log_release(review, "User")

    assert "file1 approved by User" in logs[0]["event"]
    assert "comment 1" in logs[1]["event"]
    assert "file2 rejected by User" in logs[2]["event"]
    assert "comment 2" in logs[3]["event"]

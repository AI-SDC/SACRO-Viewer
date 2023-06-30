from sacro.adapters import local_audit


def test_log_release_writes_names_of_released_files(capsys):
    outputs = ["file1", "file2"]

    local_audit.log_release(outputs, "User")

    log_output = capsys.readouterr().out
    assert outputs[0] in log_output
    assert outputs[1] in log_output
    assert "User" in log_output

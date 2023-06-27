from sacro.adapters import local_audit


def test_log_release_writes_names_of_released_files(caplog):
    outputs = ["file1", "file2"]

    local_audit.log_release(outputs)

    assert outputs[0] in caplog.text
    assert outputs[1] in caplog.text

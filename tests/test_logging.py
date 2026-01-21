import os
import sys

from sacro import logging


def test_get_appdir_on_unknown_os(monkeypatch):
    monkeypatch.setattr(sys, "platform", "unknown")
    assert "." == logging.get_appdir()


def test_get_log_filename_on_win32(monkeypatch):
    monkeypatch.setattr(sys, "platform", "win32")
    assert os.path.join("AppData", "Roaming") in logging.get_log_filename()
    assert "SACRO" in logging.get_log_filename()
    assert "error.log" in logging.get_log_filename()


def test_get_log_filename_on_linux(monkeypatch):
    monkeypatch.setattr(sys, "platform", "linux")
    assert ".config" in logging.get_log_filename()
    assert "SACRO" in logging.get_log_filename()
    assert "error.log" in logging.get_log_filename()


def test_get_log_filename_on_macos(monkeypatch):
    monkeypatch.setattr(sys, "platform", "darwin")
    assert os.path.join("Library", "Application Support") in logging.get_log_filename()
    assert "SACRO" in logging.get_log_filename()
    assert "error.log" in logging.get_log_filename()


def test_get_audit_filename_on_win32(monkeypatch):
    monkeypatch.setattr(sys, "platform", "win32")
    assert os.path.join("AppData", "Roaming") in logging.get_audit_filename()
    assert "SACRO" in logging.get_audit_filename()
    assert "audit.log" in logging.get_audit_filename()


def test_get_audit_filename_on_linux(monkeypatch):
    monkeypatch.setattr(sys, "platform", "linux")
    assert ".config" in logging.get_audit_filename()
    assert "SACRO" in logging.get_audit_filename()
    assert "audit.log" in logging.get_audit_filename()


def test_get_audit_filename_on_macos(monkeypatch):
    monkeypatch.setattr(sys, "platform", "darwin")
    assert (
        os.path.join("Library", "Application Support") in logging.get_audit_filename()
    )
    assert "SACRO" in logging.get_audit_filename()
    assert "audit.log" in logging.get_audit_filename()

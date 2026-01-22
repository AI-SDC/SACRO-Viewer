import functools

from django.conf import settings


class IncorrectVersionError(Exception):
    def __init__(self, *args, used, supported, **kwargs):
        super().__init__(*args, **kwargs)
        self.used = used
        self.supported = supported

    def __str__(self):
        return f"Unsupported ACRO output. This viewer supports ACRO version {self.supported}, but your results were generated with version {self.used}."


class UnsupportedVersionFormatError(Exception):
    def __init__(self, *args, version, **kwargs):
        super().__init__(*args, **kwargs)
        self.version = version


@functools.total_ordering
class Version:
    """Utility class to parse and compare version strings"""

    def __init__(self, version: str) -> None:
        try:
            major, minor, *_ = version.split(".")

            # check major and minor are valid numbers
            int(major)
            int(minor)

            self.major = major
            self.minor = minor
        except ValueError:
            msg = f"Expected version to be in format 1.2.3, got {version}"
            raise UnsupportedVersionFormatError(msg, version=version)

        self.original = version

    def __eq__(self, other: "Version") -> bool:
        return self.major == other.major and self.minor == other.minor

    def __gt__(self, other: "Version") -> bool:
        if self.major > other.major:
            return True

        if self.major == other.major and self.minor > other.minor:
            return True

        return False

    def __repr__(self):
        return f"Version: {self.original}"

    def __str__(self):
        return self.original


def check_version(version: str) -> None:
    """
    Check the given version against the supported version in settings

    We don't care about bugfix versions so the Version class ignores them.
    """
    supported = Version(settings.ACRO_SUPPORTED_VERSION)
    used = Version(version)

    if used < supported:
        raise IncorrectVersionError(used=used, supported=supported)

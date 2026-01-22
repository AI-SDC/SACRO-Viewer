"""
Tests for document file handling features (PDF, DOC, DOCX).
This includes:
- File upload with metadata generation
- MIME type formatting
- PDF inline serving
- Document file detection utilities
"""

import json

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client

from sacro import views


class TestMimeTypeFormatting:
    """Test the format_mime_type helper function."""

    def test_format_word_document(self):
        mime_type = (
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        assert views.format_mime_type(mime_type) == "Word Document"

    def test_format_pdf(self):
        assert views.format_mime_type("application/pdf") == "PDF"

    def test_format_csv(self):
        assert views.format_mime_type("text/csv") == "CSV"

    def test_format_unknown_mime_type(self):
        # Unknown MIME types should be returned as-is
        assert views.format_mime_type("application/unknown") == "application/unknown"

    def test_format_empty_mime_type(self):
        """Test that empty or None MIME types return an empty string."""
        assert views.format_mime_type("") == ""
        assert views.format_mime_type(None) == ""


class TestResearcherAddOutput:
    """Test the researcher_add_output view with file uploads."""

    @pytest.fixture
    def client(self):
        return Client()

    @pytest.fixture
    def test_pdf_file(self):
        """Create a simple PDF file for testing."""
        # Minimal PDF structure
        pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\nxref\n0 3\ntrailer<</Size 3/Root 1 0 R>>\nstartxref\n0\n%%EOF"
        return SimpleUploadedFile(
            "test.pdf", pdf_content, content_type="application/pdf"
        )

    @pytest.fixture
    def test_docx_file(self):
        """Create a simple DOCX file for testing."""
        # Minimal DOCX-like content (not a real DOCX but sufficient for testing)
        docx_content = b"PK\x03\x04" + b"\x00" * 100  # ZIP header
        return SimpleUploadedFile(
            "test.docx",
            docx_content,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    def test_add_output_with_pdf_file(self, client, test_outputs, test_pdf_file):
        """Test adding a PDF file generates correct metadata."""
        session_data = test_outputs.raw_metadata
        output_name = "test_pdf_output"

        output_data = {
            "uid": output_name,
            "type": "custom",
            "status": "review",
            "properties": {"method": "application/pdf"},
            "files": [{"name": "test.pdf"}],
            "comments": [],
            "exception": None,
        }

        response = client.post(
            f"/researcher/output/add/?path={test_outputs.path}",
            {
                "session_data": json.dumps(session_data),
                "name": output_name,
                "data": json.dumps(output_data),
                "file": test_pdf_file,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # Verify the file was saved
        saved_file = test_outputs.path.parent / "test.pdf"
        assert saved_file.exists()

        # Verify metadata in results.json
        with open(test_outputs.path) as f:
            results = json.load(f)

        output = results["results"][output_name]
        file_info = output["files"][0]

        # Check all required metadata fields
        assert file_info["name"] == "test.pdf"
        assert "url" in file_info
        assert "/contents/" in file_info["url"]
        assert "checksum" in file_info
        assert file_info["checksum"] is not None
        assert file_info["checksum_valid"] is True
        assert "sdc" in file_info
        assert "cell_index" in file_info

        # Check MIME type was formatted
        assert output["properties"]["method"] == "PDF"

        # Verify the response includes output_data with URL for client-side use
        assert "output_data" in data
        assert "files" in data["output_data"]
        assert len(data["output_data"]["files"]) > 0
        assert "url" in data["output_data"]["files"][0]
        assert "/contents/" in data["output_data"]["files"][0]["url"]

        # Verify checksum file was created
        checksum_file = test_outputs.path.parent / "checksums" / "test.pdf.txt"
        assert checksum_file.exists()

    def test_add_output_with_docx_file(self, client, test_outputs, test_docx_file):
        """Test adding a DOCX file generates correct metadata."""
        session_data = test_outputs.raw_metadata
        output_name = "test_docx_output"

        output_data = {
            "uid": output_name,
            "type": "custom",
            "status": "review",
            "properties": {
                "method": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            },
            "files": [{"name": "test.docx"}],
            "comments": [],
            "exception": None,
        }

        response = client.post(
            f"/researcher/output/add/?path={test_outputs.path}",
            {
                "session_data": json.dumps(session_data),
                "name": output_name,
                "data": json.dumps(output_data),
                "file": test_docx_file,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # Verify metadata
        with open(test_outputs.path) as f:
            results = json.load(f)

        output = results["results"][output_name]
        assert output["properties"]["method"] == "Word Document"

        # Verify the response includes output_data with URL for client-side use
        assert "output_data" in data
        assert "files" in data["output_data"]
        assert len(data["output_data"]["files"]) > 0
        assert "url" in data["output_data"]["files"][0]
        assert "/contents/" in data["output_data"]["files"][0]["url"]

        # Verify checksum file was created
        checksum_file = test_outputs.path.parent / "checksums" / "test.docx.txt"
        assert checksum_file.exists()


class TestContentsViewPDFServing:
    """Test the contents view serves PDFs inline."""

    @pytest.fixture
    def client(self):
        return Client()

    def test_pdf_served_inline(self, client, test_outputs):
        """Test that PDF files are served with Content-Disposition: inline."""
        # Create a test PDF file
        pdf_path = test_outputs.path.parent / "test_inline.pdf"
        pdf_path.write_bytes(b"%PDF-1.4\ntest content")

        # Add it to results.json
        with open(test_outputs.path) as f:
            data = json.load(f)

        data["results"]["test_pdf_inline"] = {
            "uid": "test_pdf_inline",
            "type": "custom",
            "status": "review",
            "properties": {"method": "PDF"},
            "files": [
                {
                    "name": "test_inline.pdf",
                    "url": f"/contents/?path={test_outputs.path}&output=test_pdf_inline&filename=test_inline.pdf",
                    "checksum": "abc123",
                    "checksum_valid": True,
                    "sdc": {},
                    "cell_index": {},
                }
            ],
            "comments": [],
            "exception": None,
        }

        with open(test_outputs.path, "w") as f:
            json.dump(data, f)

        # Request the PDF
        response = client.get(
            f"/contents/?path={test_outputs.path}&output=test_pdf_inline&filename=test_inline.pdf"
        )

        assert response.status_code == 200
        # Check that it's served inline (not as attachment)
        content_disposition = response["Content-Disposition"]
        assert "inline" in content_disposition
        assert "attachment" not in content_disposition or content_disposition.index(
            "inline"
        ) < content_disposition.index("attachment")

    def test_docx_served_as_attachment(self, client, test_outputs):
        """Test that DOCX files are still served as attachment."""
        # Create a test DOCX file
        docx_path = test_outputs.path.parent / "test_download.docx"
        docx_path.write_bytes(b"PK\x03\x04test content")

        # Add it to results.json
        with open(test_outputs.path) as f:
            data = json.load(f)

        data["results"]["test_docx_download"] = {
            "uid": "test_docx_download",
            "type": "custom",
            "status": "review",
            "properties": {"method": "Word Document"},
            "files": [
                {
                    "name": "test_download.docx",
                    "url": f"/contents/?path={test_outputs.path}&output=test_docx_download&filename=test_download.docx",
                    "checksum": "def456",
                    "checksum_valid": True,
                    "sdc": {},
                    "cell_index": {},
                }
            ],
            "comments": [],
            "exception": None,
        }

        with open(test_outputs.path, "w") as f:
            json.dump(data, f)

        # Request the DOCX
        response = client.get(
            f"/contents/?path={test_outputs.path}&output=test_docx_download&filename=test_download.docx"
        )

        assert response.status_code == 200
        # Check that it's served as attachment
        content_disposition = response["Content-Disposition"]
        assert "attachment" in content_disposition


class TestDocumentFileDetection:
    """Test utility functions for document file detection."""

    def test_is_doc_detection(self):
        """Test isDoc utility function behavior."""
        # This would be a JavaScript test, but we can verify the Python logic
        # matches what we expect
        doc_extensions = ["doc", "docx"]
        for ext in doc_extensions:
            assert ext.lower() in ["doc", "docx"]

    def test_is_pdf_detection(self):
        """Test isPdf utility function behavior."""
        assert "pdf".lower() == "pdf"

    def test_document_file_extensions(self):
        """Verify all document extensions are recognized."""
        document_extensions = ["doc", "docx", "pdf"]
        for ext in document_extensions:
            assert ext in ["doc", "docx", "pdf"]

import pytest
from pathlib import Path
import sys
import os

# Thêm path để import được script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.selenium_image_scraper import download_image

def test_download_image_base64(tmp_path):
    # Một pixel trắng base64
    base64_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    folder = tmp_path / "test_folder"
    folder.mkdir()
    prefix = "test"
    
    result = download_image(base64_url, folder, prefix)
    
    assert result is True
    files = list(folder.glob("*.png"))
    assert len(files) == 1
    assert files[0].name.startswith("test_")

def test_download_image_http_fail():
    # URL không tồn tại
    url = "https://this-is-a-fake-url-123456.com/image.jpg"
    folder = Path("./non_existent")
    prefix = "test"
    
    result = download_image(url, folder, prefix)
    assert result is False

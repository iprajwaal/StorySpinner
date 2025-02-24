from langchain_community.document_loaders import WebBaseLoader
from langchain_community.document_loaders import YoutubeLoader
import requests
from bs4 import BeautifulSoup
import re
from typing import List, Dict, Any

def is_youtube_url(url: str) -> bool:
    """Check if a URL is from YouTube."""
    youtube_patterns = [
        r'(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([^\s&]+)',
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^\s&]+)',
        r'(?:https?:\/\/)?youtu\.be\/([^\s&]+)'
    ]
    
    for pattern in youtube_patterns:
        if re.match(pattern, url):
            return True
    return False

def load_content_from_url(url: str) -> List[Dict[str, Any]]:
    """Load content from any URL, detecting the type and using the appropriate loader."""
    try:
        if is_youtube_url(url):
            print(f"Loading YouTube content from: {url}")
            loader = YoutubeLoader.from_youtube_url(url, add_video_info=True)
        else:
            print(f"Loading web content from: {url}")
            loader = WebBaseLoader(url)
            
        documents = loader.load()
        
        for doc in documents:
            if 'source' not in doc.metadata:
                doc.metadata['source'] = url
                
        return documents
    except Exception as e:
        print(f"Error loading content from {url}: {e}")
        return [{
            "page_content": f"Error loading content from URL: {e}",
            "metadata": {"source": url, "error": str(e)}
        }]
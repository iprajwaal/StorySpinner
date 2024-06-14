from langchain.document_loaders import YoutubeLoader

def load_youtube_video(url):
    loader = YoutubeLoader.from_youtube_url(url, add_video_info=True)
    return loader.load()

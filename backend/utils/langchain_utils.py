from typing import List
from langchain_community.document_loaders.text import TextLoader
from langchain_community.document_loaders.youtube import YoutubeLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_community.llms import VertexAI
from vertexai.language_models import TextEmbeddingInput, TextEmbeddingModel
from langchain_community.embeddings import VertexAIEmbeddings
from langchain_community.vectorstores import Chroma

# Initialize the Vertex AI language model
model_name = "text-bison@001"
llm = VertexAI(model_name=model_name, max_output_tokens=456, temperature=0.1, top_p=0.8, top_k=40, verbose=True)

# Define the function to embed text using Vertex AI Language Models
def embed_text(texts: List[str], model_name: str) -> List[List[float]]:
    model = TextEmbeddingModel.from_pretrained(model_name)
    inputs = [TextEmbeddingInput(text, task="QUESTION_ANSWERING") for text in texts]
    embeddings = model.get_embeddings(inputs)
    return [embedding.values for embedding in embeddings]

def sm_ask(url: str, question: str, print_results: bool = True):
    try:
        if url.startswith("https://youtu.be/"):
            loader = YoutubeLoader.from_youtube_url(url, add_video_info=True)
        else:
            loader = TextLoader(url)

        result = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=0)
        docs = text_splitter.split_documents(result)

        # Inspect the structure of the Document object
        # print(docs[0])  # Print the first document
        # You may need to iterate through docs and print each document to understand its structure

        # Embed text content using Vertex AI Language Models
        # texts = []
        # for doc in docs:
        #     # Modify this part according to the actual structure of the Document object
        #     # If the text content is stored in a different attribute, use that attribute here
        #     text = getattr(doc, "text", None)
        #     if text:
        #         texts.append(text)

        # print("Texts:", texts)
        # embeddings = embed_text(texts, model_name)
        EMBEDDING_QPM = 100
        EMBEDDING_NUM_BATCH =5
        embeddings = VertexAIEmbeddings(
        requests_per_minute=EMBEDDING_QPM,
        num_instances_per_batch=EMBEDDING_NUM_BATCH,
        )

        db = Chroma.from_documents(docs, embeddings)
        retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": 2})

        # Perform question answering using Langchain and Vertex AI
        qa = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever, return_source_documents=True)
        video_subset = qa({"query": question})
        context = video_subset

        # print("Context:", context)
        # Format the prompt for Vertex AI Language Model
        prompt = f"""
        Answer the following question in a detailed manner, using information from the text below. If the answer is not in the text, say 'HMM don't you try this out buddy I don't know and do not generate my own response'.

        Question:
        {question}

        Text:
        {context}

        Question:
        {question}

        Answer:
        """

        # Generate response using Vertex AI Language Model
        response = llm.predict(prompt)
        print("Response:", response)
        return {"answer": response, "context": context}

    except Exception as e:
        print(f"Error processing URL: {e}")
        return {"answer": "Error: Could not process the URL."}
    
if __name__ == "__main__":
    url = "https://youtu.be/SCIfWhAheVw"
    question = "What is the main idea of the video?"
    sm_ask(url, question)

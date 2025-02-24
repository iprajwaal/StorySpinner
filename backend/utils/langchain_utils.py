import os
from typing import List, Dict, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import Chroma
from langchain_google_vertexai import VertexAI
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.prompts import PromptTemplate
from utils.web_utils import load_content_from_url

model_name = "gemini-1.5-pro-002"
llm = VertexAI(model_name=model_name, max_output_tokens=4096, temperature=0.1, top_p=0.8, top_k=40, verbose=True)

# Initialize HuggingFace embeddings
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

# Create a single persistent database
DB_DIR = "chroma_reusable_db"
os.makedirs(DB_DIR, exist_ok=True)

# Keeps track of the current URL being processed
current_url = None
db = None

def sm_ask(url: str, question: str, print_results: bool = True):
    global current_url, db
    
    try:
        url_changed = current_url != url
        
        if url_changed or db is None:
            print(f"Processing new URL: {url}")
            docs = load_content_from_url(url)
            
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            chunks = text_splitter.split_documents(docs)
            
            print(f"Successfully loaded and split content into {len(chunks)} chunks")
            
            if db is not None:
                print("Clearing existing database...")
                db.delete_collection()
            
            print("Creating vector database with new content...")
            db = Chroma.from_documents(
                chunks,
                embeddings,
                persist_directory=DB_DIR,
                collection_name="web_content"
            )
            
            current_url = url
        else:
            print(f"Using existing database for URL: {url}")
        
        retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": 5})
        print("Vector database ready. Setting up QA chain...")

        # Custom prompt template for web content analysis
        custom_prompt_template = """
        You are a specialized web content analyst working with a web tool. Your task is to answer questions based ONLY on the provided web content.

        IMPORTANT INSTRUCTIONS:
        1. Use ONLY the context provided below to formulate your answer
        2. Do NOT use any general knowledge outside this context
        3. If the answer is not contained in the context, say "Based on the available content, I cannot find an answer to this question."
        4. Format your response as clean, plain text without markdown formatting, bullets, or special characters
        5. Make your answers concise and direct for display in a web interface
        6. Cite specific parts of the content when relevant
        
        Context from the web page:
        {context}
        
        User Question: {question}
        
        Answer (using only information from the provided content):
        """
        
        CUSTOM_PROMPT = PromptTemplate(
            template=custom_prompt_template,
            input_variables=["context", "question"]
        )

        # Perform question answering
        qa = RetrievalQA.from_chain_type(
            llm=llm, 
            chain_type="stuff", 
            retriever=retriever,
            chain_type_kwargs={"prompt": CUSTOM_PROMPT},
            return_source_documents=True
        )
        
        print("Answering question...")
        if not question or question.lower().strip() in ["what is this about?", "summarize", "tell me about this"]:
            question = f"Provide a clear, concise summary of the key information from {url.split('/')[-1].replace('_', ' ')}. Format your response as plain text for a web interface."
            
        result = qa({"query": question})
        
        if print_results:
            print(f"Question: {question}")
            print(f"Answer: {result['result']}")
            
        formatted_sources = []
        if "source_documents" in result:
            for i, doc in enumerate(result["source_documents"]):
                source = doc.metadata.get("source", url)
                formatted_sources.append({
                    "content": doc.page_content[:500] + ("..." if len(doc.page_content) > 500 else ""),
                    "metadata": {"source": source},
                    "source": source
                })
        
        return {
            "success": True,
            "answer": result['result'],
            "source_documents": formatted_sources,
            "context": {
                "formatted_sources": formatted_sources
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error processing URL: {e}")
        return {
            "success": False,
            "error": f"Could not process the URL: {str(e)}",
            "answer": f"Error: Could not process the URL. {str(e)}", 
            "source_documents": [],
            "context": None
        }
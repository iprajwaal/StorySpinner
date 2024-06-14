import os
import vertexai
from dotenv import load_dotenv
from utils.langchain_utils import sm_ask
import json
from flask import Flask, jsonify, render_template, request
from google.oauth2 import service_account
from google.oauth2 import service_account
from langchain_google_vertexai import VertexAI
from flask_cors import CORS

load_dotenv()  # Load environment variables from .env file


load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET","POST"])
def index():
    if request.method == "GET":
        return "Oiii!"
    if request.method == "POST":
        data = request.get_json()
        response = sm_ask(data['url'], data['question'])  # Call sm_ask function
        # Extract the required data
        answer = response["answer"]
        context = response["context"]
        # remove 'source_documents' key from the context
        document = context['source_documents']
        # convert the document to json
        metadata = document[0].metadata
        page_content = document[0].page_content

        return jsonify({"answer": answer, "metadata": metadata, "page_content": page_content})

if __name__ == "__main__":
    app.run()
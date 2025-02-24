import os
import vertexai
from dotenv import load_dotenv
from utils.langchain_utils import sm_ask
import json
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS

load_dotenv() 

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET","POST"])
def index():
    if request.method == "GET":
        return "Web Content Q&A Tool API is running!"
    
    if request.method == "POST":
        try:
            data = request.get_json()
            
            if not data or 'url' not in data:
                return jsonify({
                    "error": "Missing required field 'url'.",
                    "success": False
                }), 400
            
            question = data.get('question', "Provide a comprehensive summary of this content")
                
            response = sm_ask(data['url'], question)
            
            if response.get("success") is False:
                return jsonify({
                    "answer": response.get("answer", "An error occurred"),
                    "error": response.get("error", "Unknown error"),
                    "success": False
                }), 500
                
            answer = response.get("answer", "")
            
            source_documents = []
            if "source_documents" in response:
                source_documents = response["source_documents"]
            elif "context" in response and response["context"] and "formatted_sources" in response["context"]:
                source_documents = response["context"]["formatted_sources"]
            
            return jsonify({
                "answer": answer,
                "source_documents": source_documents,
                "success": True
            })
            
        except Exception as e:
            import traceback
            print(f"ERROR IN ROUTE HANDLER: {traceback.format_exc()}")
            return jsonify({
                "error": f"An error occurred while processing your request: {str(e)}",
                "success": False,
                "answer": f"Server error: {str(e)}"
            }), 500

@app.route("/search", methods=["POST"])
def search():
    try:
        from vertexai.generative_models import GenerationResponse, GenerationConfig, GenerativeModel, grounding, Tool
        
        data = request.get_json()
        
        if not data or 'question' not in data:
            return jsonify({
                "error": "Missing required field 'question'.",
                "success": False
            }), 400
            
        PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "central-rush-447806-r8")
        vertexai.init(project=PROJECT_ID)

        MODEL_NAME = 'gemini-1.5-pro-002'
        TEMPERATURE = 0.0
        MAX_OUTPUT_TOKENS = 8192
        TOP_P = 0.0

        model = GenerativeModel(model_name=MODEL_NAME)

        tool = Tool.from_google_search_retrieval(grounding.GoogleSearchRetrieval())

        response = model.generate_content(
            data['question'],
            tools=[tool],
            generation_config=GenerationConfig(
                temperature=TEMPERATURE,
                max_output_tokens=MAX_OUTPUT_TOKENS,
                top_p=TOP_P
            ),
        )
        
        if response and response.candidates:
            answer = response.candidates[0].content.parts[0].text
            return jsonify({
                "answer": answer,
                "success": True
            })
        else:
            return jsonify({
                "error": "Failed to generate a response.",
                "success": False
            }), 500
            
    except Exception as e:
        return jsonify({
            "error": f"An error occurred while processing your search request: {str(e)}",
            "success": False
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)
    print(f"Server running on port {port}")
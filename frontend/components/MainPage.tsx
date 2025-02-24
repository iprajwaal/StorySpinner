"use client";

import { useState } from "react";
import { Transition } from '@headlessui/react';

export default function MainPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [url, setUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [sourceDocuments, setSourceDocuments] = useState<SourceDocument[]>([]);
  const [error, setError] = useState("");
  const [showSources, setShowSources] = useState(false);
  const [activeTab, setActiveTab] = useState("url");
  

  const handleSubmit = async () => {
    if (activeTab === "url" && !url) {
      setError("Please enter a URL");
      return;
    }
    if (!question) {
      setError("Please enter a question");
      return;
    }

    setError("");
    setLoading(true);
    setResponse("");
    setSourceDocuments([]);

    try {
      const endpoint = activeTab === "url" ? "" : "/search";
      const requestBody = activeTab === "url" 
        ? { "url": url, "question": question }
        : { "question": question };

      const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json();
      
      if (data.success === false) {
        setError(data.error || data.answer || "An error occurred");
      } else {
        setResponse(data.answer);
        if (data.source_documents) {
          setSourceDocuments(data.source_documents);
        }
      }
    } catch (error) {
      setError("Failed to connect to the server. Make sure the backend is running on port 8000.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResponse("");
    setSourceDocuments([]);
    setError("");
  };

  interface SourceDocument {
    content: string;
    metadata?: {
      source?: string;
    };
    source?: string;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const sampleQuestions = [
    "Summarize the key information",
    "What are the main topics covered?",
    "Explain the historical significance",
    "What are the benefits mentioned?",
    "Compare the different perspectives"
  ];

  const sampleUrls = [
    "https://en.wikipedia.org/wiki/Artificial_intelligence",
    "https://medium.com/@prajwaal/tensor-basics-types-operations-and-applications-in-tensorflow-e70e32802740",
    "https://timesofindia.indiatimes.com/",
    "https://www.nasa.gov/solar-system/mars/"
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gradient-to-b from-gray-50 to-gray-100">
      <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 h-20 mb-2">
        StorySpinner
      </h1>
      <p className="text-gray-600 mb-6">Extract valuable insights from any webpage content</p>
      
      <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-2 px-4 mr-2 font-medium text-sm focus:outline-none ${
                activeTab === "url" 
                  ? "text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setActiveTab("url");
                clearResults();
              }}
            >
              Website Analysis
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                activeTab === "web" 
                  ? "text-blue-600 border-b-2 border-blue-600" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setActiveTab("web");
                clearResults();
              }}
            >
              Web Search
            </button>
          </div>
          
          {activeTab === "url" && (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="url">
                Website URL
              </label>
              <div className="flex">
                <input
                  id="url"
                  className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  type="text"
                  placeholder="Enter any URL (website, YouTube, etc.)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded-r"
                  type="button"
                  onClick={() => {
                    if (sampleUrls.length) {
                      const randomUrl = sampleUrls[Math.floor(Math.random() * sampleUrls.length)];
                      setUrl(randomUrl);
                    }
                  }}
                >
                  Sample
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Examples: Wikipedia articles, news sites, YouTube videos, blogs
              </p>
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="question">
              {activeTab === "url" ? "Your Question" : "Search Query"}
            </label>
            <div className="flex">
              <input
                id="question"
                className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                type="text"
                placeholder={activeTab === "url" 
                  ? "What would you like to know about this content?" 
                  : "What would you like to search for?"}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-3 rounded-r"
                type="button"
                onClick={() => {
                  if (sampleQuestions.length) {
                    const randomQ = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
                    setQuestion(randomQ);
                  }
                }}
              >
                Sample
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-150"
              type="button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                activeTab === "url" ? "Analyze Content" : "Search Web"
              )}
            </button>
            
            {(response || error) && (
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="button"
                onClick={clearResults}
              >
                Clear Results
              </button>
            )}
          </div>
          
          <Transition
            show={!!error}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          </Transition>
          
          {loading && (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">
                {activeTab === "url" 
                  ? "Analyzing content and generating insights..."
                  : "Searching the web for relevant information..."}
              </p>
            </div>
          )}
          
          <Transition
            show={!!response && !loading}
            enter="transition-opacity duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="mt-6">
              <div className="bg-gray-50 p-5 rounded-lg shadow-inner border border-gray-200">
                <h3 className="font-bold text-lg mb-3 text-blue-700">AI Analysis</h3>
                <div className="text-gray-700 prose max-w-none">
                  {/* Split paragraphs and render them with spacing */}
                  {response.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-3">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              
              {sourceDocuments && sourceDocuments.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 mr-1 transition-transform ${showSources ? 'rotate-90' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {showSources ? "Hide Sources" : "Show Sources"} ({sourceDocuments.length})
                  </button>
                  
                  <Transition
                    show={showSources}
                    enter="transition-opacity duration-300 ease-out"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity duration-150 ease-in"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="mt-2 bg-gray-50 p-4 rounded-lg max-h-80 overflow-y-auto border border-gray-200">
                      <h3 className="font-bold text-md mb-2 text-gray-700">Source Content</h3>
                      {sourceDocuments.map((doc, index) => (
                        <div key={index} className="mb-4 pb-4 border-b border-gray-200 last:border-b-0">
                          <div className="text-sm text-gray-700 mb-1">
                            {doc.content}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Source: {(doc as SourceDocument).metadata?.source || doc.source || "Unknown"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Transition>
                </div>
              )}
            </div>
          </Transition>
        </div>
      </div>
      
      <footer className="mt-10 text-center text-gray-500 text-sm">
        <p>
          StorySpinner - Extract valuable insights from web content with AI
        </p>
      </footer>
    </div>
  );
}
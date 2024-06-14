"use client";

import { useState } from "react";

export default function MainPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [question, setQuestion] = useState("");


  const handleYoutubeSubmit = async () => {
    setLoading(true);
    const requestBody = {
        "url": youtubeUrl,
        "question": question
    };

    const res = await fetch("http://127.0.0.1:5000", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    const data = await res.json();
    setResponse(data?.answer);
    setLoading(false);
    // handle the response data as needed
};

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100">
      <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 h-20">
        StorySpinner
      </h1>
      <div className="mt-10 w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl h-[60vh]">
        <div className="p-8">
          <div className="mt-5">
            <div className="flex items-center border-b border-teal-500 py-2">
              <input
                className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
                type="text"
                placeholder="Enter YouTube URL. Ex: https://youtu.be/XXXXXXXXXXX"
                aria-label="Enter YouTube URL"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
            </div>
            <div className="flex items-center border-b border-teal-500 py-2 mt-2">
              <input
                className="appearance-none bg-transparent border-none w-full text-gray-700 mr-3 py-1 px-2 leading-tight focus:outline-none"
                type="text"
                placeholder="Enter your question"
                aria-label="Enter your question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <button
              className="flex-shrink-0 bg-teal-500 hover:bg-teal-700 border-teal-500 hover:border-teal-700 text-sm border-4 text-white py-1 px-2 rounded mt-3"
              type="button"
              onClick={handleYoutubeSubmit}
            >
              Submit
            </button>
          </div>
          {loading ? (
            <div className="mt-5 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="mt-5  text-gray-700 max-h-40 overflow-y-auto text-justify p-4 rounded bg-gray-100 bg-opacity-70">
              {response}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

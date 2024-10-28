import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/transcribe/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTranscript(data.transcript);
      } else {
        console.error("Error uploading file:", response.statusText);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className="App">
      <h1>Upload Audio for Transcription</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload and Transcribe</button>
      {transcript && (
        <div>
          <h2>Transcription</h2>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}

export default App;

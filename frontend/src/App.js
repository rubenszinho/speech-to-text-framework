import React, { useState } from 'react';
import {
  Container, Typography, Button, LinearProgress, Card, CardContent, TextField, Alert, CircularProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

function App() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [qualityRate, setQualityRate] = useState(null);  // Quality rate as number
  const [observations, setObservations] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);  // Start loading indicator

    try {
      const response = await fetch("http://localhost:8000/transcribe/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTranscript(data.transcript);
        setQualityRate(parseInt(data.quality_rate, 10));  // Parse as integer
        setObservations(data.important_observations);
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Unknown error occurred");
        console.error("Error uploading file:", errorData.error);
      }
    } catch (error) {
      setError("Error uploading file: " + error.message);
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);  // Stop loading indicator
    }
  };

  return (
    <Container maxWidth="md" style={{ marginTop: "2rem" }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Supervisor's Audio Upload
      </Typography>
      <TextField
        type="file"
        onChange={handleFileChange}
        fullWidth
        InputProps={{
          startAdornment: <UploadFileIcon style={{ marginRight: "0.5rem", color: "#1976d2" }} />
        }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        style={{ marginTop: "1rem" }}
        startIcon={<UploadFileIcon />}
      >
        Upload and Transcribe
      </Button>

      {loading && <CircularProgress style={{ marginTop: "1rem" }} />}  {/* Show loading spinner while waiting */}

      {error && (
        <Alert severity="error" style={{ marginTop: "1rem" }}>
          {error}
        </Alert>
      )}

      {transcript && !loading && (
        <Card style={{ marginTop: "2rem" }}>
          <CardContent>
            <Typography variant="h6" color="primary">
              Transcription
            </Typography>
            <Typography variant="body1" style={{ marginBottom: "1rem" }}>
              {transcript}
            </Typography>

            <Typography variant="h6" color="primary">
              Quality Rate: {qualityRate}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={qualityRate || 0}  // Ensure it’s a number
              style={{
                height: "10px",
                borderRadius: "5px",
                marginTop: "0.5rem",
                backgroundColor: qualityRate >= 70 ? "#c8e6c9" : "#ffcdd2",
              }}
            />

            {qualityRate >= 70 ? (
              <Alert severity="success" style={{ marginTop: "1rem" }}>
                Message quality meets the threshold and is approved for the operator.
              </Alert>
            ) : (
              <Alert severity="error" style={{ marginTop: "1rem" }}>
                Message quality does not meet the threshold.
              </Alert>
            )}

            <Typography variant="h6" color="primary" style={{ marginTop: "1rem" }}>
              Important Observations:
            </Typography>
            <Typography variant="body2">
              {observations}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default App;

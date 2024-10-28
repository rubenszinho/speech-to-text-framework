import React, { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  LinearProgress,
  Card,
  CardContent,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

function App() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [qualityRate, setQualityRate] = useState(0);
  const [observations, setObservations] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        mode: 'cors',
        headers: {
          'Access-Control-Allow-Origin': 'http://localhost:3000',
          'Accept': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTranscript(data.transcript);
        setQualityRate(data.quality_rate);
        setObservations(data.important_observations);
        setError(""); // Clear any previous error
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      setError("Error uploading file: " + error.message);
      console.error("Error uploading file:", error);
    }
  };

  return (
    <Container maxWidth="md" style={{ marginTop: '2rem' }}>
      <Typography variant="h4" color="primary" gutterBottom>
        Supervisor's Audio Upload
      </Typography>
      <TextField
        type="file"
        onChange={handleFileChange}
        fullWidth
        InputProps={{
          startAdornment: (
            <UploadFileIcon style={{ marginRight: '0.5rem', color: '#1976d2' }} />
          ),
        }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        style={{ marginTop: '1rem' }}
        startIcon={<UploadFileIcon />}
        disabled={loading}
      >
        Upload and Transcribe
      </Button>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <CircularProgress color="primary" />
        </div>
      )}

      {error && (
        <Alert severity="error" style={{ marginTop: '1rem' }}>
          {error}
        </Alert>
      )}

      {!loading && transcript && (
        <Card style={{ marginTop: '2rem' }}>
          <CardContent>
            <Typography variant="h6" color="primary">
              Transcription
            </Typography>
            <Typography variant="body1" style={{ marginBottom: '1rem' }}>
              {transcript}
            </Typography>

            <Typography variant="h6" color="primary">
              Quality Rate: {qualityRate}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={qualityRate}
              style={{ height: '10px', borderRadius: '5px', marginTop: '0.5rem' }}
              sx={{
                backgroundColor: '#c5cae9',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: qualityRate >= 70 ? 'green' : 'red',
                },
              }}
            />

            {qualityRate >= 70 ? (
              <Alert severity="success" style={{ marginTop: '1rem' }}>
                Message quality meets the threshold and is approved for the operator.
              </Alert>
            ) : (
              <Alert severity="warning" style={{ marginTop: '1rem' }}>
                Message quality is below the threshold.
              </Alert>
            )}

            <Typography variant="h6" color="primary" style={{ marginTop: '1rem' }}>
              Important Observations:
            </Typography>
            <Typography variant="body2">{observations}</Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}

export default App;

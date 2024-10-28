FROM python:3.9

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Whisper separately
RUN pip install git+https://github.com/openai/whisper.git

COPY . .

EXPOSE 8000

# Start the Flask application
CMD ["python", "app.py"]

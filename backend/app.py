from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy.orm import Session
import whisper
from openai import OpenAI
import os
import traceback
from models import Transcription, SessionLocal, init_db

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

init_db()
model = whisper.load_model("turbo")

client = OpenAI(api_key="your_openai_api_key")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.route("/transcribe/", methods=["POST"])
def transcribe_and_evaluate_audio():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.content_type not in ["audio/wav", "audio/mpeg", "audio/mp4"]:
        return jsonify({"error": "Invalid audio file format"}), 400

    temp_audio_file = "temp_audio." + file.filename.split(".")[-1]
    file.save(temp_audio_file)

    try:
        result = model.transcribe(temp_audio_file, language='pt')
        transcript = result["text"]
    except Exception as e:
        print(f"Transcription error: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Error during transcription: {e}"}), 500
    finally:
        os.remove(temp_audio_file)

    db = next(get_db())
    transcription_entry = Transcription(filename=file.filename, transcript=transcript)
    db.add(transcription_entry)
    db.commit()

    prompt = f"""
    Rate the quality of this maintenance message transcript from 0% to 100% and list the most important observations José should make based on the message.

    Transcript: "{transcript}"

    Response format:
    - Quality Rate: <percentage>
    - Important Observations: <list observations>
    """

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an assistant that evaluates maintenance instructions."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0.7
        )
        evaluation = response.choices[0].message.content.strip()
        
        lines = evaluation.split("\n", 1)
        if len(lines) < 2:
            raise ValueError("The response from OpenAI API does not contain the expected format.")
        quality_rate = int(lines[0].replace("Quality Rate: ", "").replace("%", "").strip()) 
        important_observations = lines[1].replace("Important Observations: ", "").strip()

        return jsonify({
            "id": transcription_entry.id,
            "filename": transcription_entry.filename,
            "transcript": transcript,
            "quality_rate": quality_rate,
            "important_observations": important_observations
        })
    except Exception as e:
        print(f"OpenAI evaluation error: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Error during evaluation: {e}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)

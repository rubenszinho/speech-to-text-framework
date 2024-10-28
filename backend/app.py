from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import whisper
import os
from .models import Transcription, SessionLocal, init_db

app = FastAPI()

init_db()

model = whisper.load_model("base")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.content_type not in ["audio/wav", "audio/mpeg", "audio/mp4"]:
        raise HTTPException(status_code=400, detail="Invalid audio file format.")

    audio_content = await file.read()
    temp_audio_file = "temp_audio." + file.filename.split(".")[-1]
    with open(temp_audio_file, "wb") as f:
        f.write(audio_content)

    try:
        result = model.transcribe(temp_audio_file, language='pt')
        transcript = result["text"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during transcription: {e}")
    finally:
        os.remove(temp_audio_file)

    transcription_entry = Transcription(filename=file.filename, transcript=transcript)
    db.add(transcription_entry)
    db.commit()

    return {"transcript": transcript}

@app.get("/transcriptions/")
def get_transcriptions(db: Session = Depends(get_db)):
    transcriptions = db.query(Transcription).all()
    return [{"id": t.id, "filename": t.filename, "transcript": t.transcript} for t in transcriptions]

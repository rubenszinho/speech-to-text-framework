import React from 'react';

function Transcriptions({ transcriptions }) {
    return (
        <div>
            {transcriptions.map((t) => (
                <div key={t.id}>
                    <h3>{t.filename}</h3>
                    <p>{t.transcript}</p>
                </div>
            ))}
        </div>
    );
}

export default Transcriptions;

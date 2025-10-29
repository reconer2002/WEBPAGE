import React, { useState } from 'react';
import enviosService from '../../services/enviosService';

const Star = ({ filled, onClick }) => (
  <button type="button" className={`star ${filled ? 'filled' : ''}`} onClick={onClick} aria-label="Estrella">
    {filled ? '★' : '☆'}
  </button>
);

const ReviewForm = ({ envioId, onSaved }) => {
  const [stars, setStars] = useState(5);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await enviosService.submitReview(envioId, { estrellas: Number(stars), comentario: comentario || null });
      setSaved(true);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Error guardando reseña');
    } finally {
      setLoading(false);
    }
  };

  if (saved) return <div className="review-saved">Gracias por tu reseña.</div>;

  return (
    <div className="review-form">
      <div className="stars">
        {[1,2,3,4,5].map((n) => (
          <Star key={n} filled={n <= stars} onClick={() => setStars(n)} />
        ))}
      </div>
      <textarea placeholder="Escribe tu opinión (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} />
      {error && <div className="error" style={{ color: '#b91c1c' }}>{error}</div>}
      <div style={{ marginTop: 8 }}>
        <button className="btn" onClick={submit} disabled={loading}>{loading ? 'Enviando...' : 'Enviar reseña'}</button>
      </div>
    </div>
  );
};

export default ReviewForm;

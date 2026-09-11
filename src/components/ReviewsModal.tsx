import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MessageSquare,
  Award,
  User,
  ThumbsUp,
  CheckCircle2
} from 'lucide-react';
import {
  ReputationReview,
  fetchTargetReviews,
  addReputationReview,
  UserProfile
} from '../services/firebaseService';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  currentUser: UserProfile | null;
}

export const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetName,
  currentUser,
}) => {
  const [reviews, setReviews] = useState<ReputationReview[]>([]);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const loadReviews = async () => {
    if (!targetId) return;
    const list = await fetchTargetReviews(targetId);
    setReviews(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadReviews();
    }
  }, [isOpen, targetId]);

  if (!isOpen) return null;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !commentInput.trim()) return;

    setLoading(true);
    try {
      const newRev: ReputationReview = {
        id: `rev-${Date.now()}`,
        targetId,
        authorUserId: currentUser.uid,
        authorName: currentUser.displayName || 'Usuario TalentMatch',
        authorAvatar: currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        rating: ratingInput,
        comment: commentInput,
        createdAt: new Date().toISOString().split('T')[0]
      };

      await addReputationReview(newRev);
      setCommentInput('');
      loadReviews();
    } catch (err) {
      console.error('Error adding review:', err);
    } finally {
      setLoading(false);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#161618] border border-[#00ff41]/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col space-y-5">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00ff41] text-black flex items-center justify-center font-black">
              <Star className="w-5 h-5 fill-black" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-tight">
                Reputación & Calificaciones
              </h3>
              <p className="text-[11px] text-white/60">
                Reseñas de Scouting para {targetName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rating Summary Header */}
        <div className="bg-[#0a0a0c] border border-white/10 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/40 uppercase font-bold block">Promedio de Calificación</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black text-white">{avgRating}</span>
              <div className="flex items-center text-yellow-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(Number(avgRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <span className="text-xs text-white/60 font-bold">
            {reviews.length} {reviews.length === 1 ? 'Calificación' : 'Calificaciones'}
          </span>
        </div>

        {/* Reviews List */}
        <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
          {reviews.length === 0 ? (
            <div className="text-center py-6 text-white/40 text-xs">
              Aún no hay reseñas registradas para este perfil. ¡Sé el primero en calificarlo!
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="bg-[#121214] border border-white/5 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={r.authorAvatar}
                      alt={r.authorName}
                      className="w-7 h-7 rounded-lg object-cover border border-white/20"
                    />
                    <strong className="text-xs text-white font-bold">{r.authorName}</strong>
                  </div>
                  <div className="flex items-center text-yellow-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-white/70 italic leading-relaxed">"{r.comment}"</p>
                <span className="text-[9px] text-white/30 font-mono block text-right">{r.createdAt}</span>
              </div>
            ))
          )}
        </div>

        {/* Submit Review Form */}
        {currentUser ? (
          <form onSubmit={handleSubmitReview} className="space-y-3 pt-3 border-t border-white/10 text-xs">
            <div>
              <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                Tu Valoración
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingInput(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= ratingInput ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-white/60 font-bold uppercase text-[10px] block mb-1">
                Comentario Deportivo / Reseña Técnica
              </label>
              <textarea
                required
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                rows={2}
                placeholder="Escribe sobre la disciplina, profesionalismo o desempeño de este perfil..."
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#00ff41]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !commentInput.trim()}
              className="w-full py-2.5 bg-[#00ff41] hover:bg-[#00ff41]/90 text-black font-black uppercase text-xs tracking-wider rounded-xl shadow-lg transition-all"
            >
              {loading ? 'Publicando...' : 'Publicar Calificación'}
            </button>
          </form>
        ) : (
          <div className="text-center p-3 bg-white/5 rounded-xl text-xs text-white/60">
            Inicia sesión para dejar una reseña de reputación.
          </div>
        )}
      </div>
    </div>
  );
};

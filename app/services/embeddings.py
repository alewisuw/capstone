import hashlib
import numpy as np
import torch
from typing import List, Dict, Optional, Tuple
from functools import lru_cache
from sentence_transformers import SentenceTransformer

from retrieval.demographic_enums import DemographicContextGenerator


@lru_cache
def get_model():
    return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def _cache_key(interests: Tuple[str, ...], demo_keys: Tuple[Tuple[str, str], ...]) -> str:
    raw = repr((interests, demo_keys))
    return hashlib.md5(raw.encode()).hexdigest()


class EmbeddingFusion:
    def __init__(self):
        self.model = get_model()
        self.embedding_dim = 384
        self._cache: Dict[str, Optional[np.ndarray]] = {}
        self._max_cache = 256

    def _encode_or_zero(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.zeros(self.embedding_dim)

        emb = self.model.encode(texts)
        if isinstance(emb, torch.Tensor):
            emb = emb.cpu().detach().numpy()

        emb_array = np.asarray(emb)
        return emb_array.mean(axis=0) if emb_array.ndim > 1 else emb_array.flatten()

    def create_fused_embedding(
        self,
        interests: List[str],
        demographics: Dict,
    ) -> Optional[np.ndarray]:
        key = _cache_key(
            tuple(sorted(interests)),
            tuple(sorted((k, v) for k, v in demographics.items() if v)),
        )

        if key in self._cache:
            return self._cache[key]

        interest_emb = self._encode_or_zero(interests)
        demo_terms = (
            DemographicContextGenerator.generate_demographic_context(demographics)
            if demographics else []
        )
        demographic_emb = self._encode_or_zero(demo_terms)

        has_interests = bool(np.any(interest_emb))
        has_demographics = bool(np.any(demographic_emb))

        if has_interests and has_demographics:
            result = interest_emb * 0.8 + demographic_emb * 0.2
        elif has_interests:
            result = interest_emb
        elif has_demographics:
            result = demographic_emb
        else:
            result = None

        if len(self._cache) >= self._max_cache:
            self._cache.pop(next(iter(self._cache)))
        self._cache[key] = result
        return result


@lru_cache
def get_fusion() -> EmbeddingFusion:
    return EmbeddingFusion()

import numpy as np
import torch
from typing import List, Dict
from functools import lru_cache
from sentence_transformers import SentenceTransformer

from retrieval.demographic_enums import DemographicContextGenerator


@lru_cache
def get_model():
    return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


class EmbeddingFusion:
    def __init__(self):
        self.model = get_model()
        self.embedding_dim = 384

    def _encode_or_zero(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.zeros(self.embedding_dim)

        emb = self.model.encode(texts)
        if isinstance(emb, torch.Tensor):
            emb = emb.cpu().detach().numpy()

        emb_array = np.asarray(emb)
        return emb_array.mean(axis=0) if emb_array.ndim > 1 else emb_array.flatten()

    def create_interest_embedding(self, interests: List[str]) -> np.ndarray:
        return self._encode_or_zero(interests)

    def create_demographic_embedding(self, demographics: Dict) -> np.ndarray:
        terms = (
            DemographicContextGenerator.generate_demographic_context(demographics)
            if demographics else []
        )
        return self._encode_or_zero(terms)

    def create_fused_embedding(
        self,
        interests: List[str],
        demographics: Dict,
    ) -> np.ndarray:
        interest_emb = self.create_interest_embedding(interests)
        demographic_emb = self.create_demographic_embedding(demographics)

        return interest_emb * 0.8 + demographic_emb * 0.2


@lru_cache
def get_fusion() -> EmbeddingFusion:
    return EmbeddingFusion()

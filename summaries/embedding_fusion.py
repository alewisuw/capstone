import numpy as np
import torch
from typing import List, Dict
from sentence_transformers import SentenceTransformer
from demographic_enums import DemographicContextGenerator

class EmbeddingFusion:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = 384
    
    def _encode_or_zero(self, texts: List[str]) -> np.ndarray:
        if not texts:
            return np.zeros(self.embedding_dim)
        
        emb = self.model.encode(texts)
        if isinstance(emb, torch.Tensor):
            emb = emb.cpu().detach().numpy()
        
        emb_array = np.asarray(emb)  # type: ignore
        return emb_array.mean(axis=0) if emb_array.ndim > 1 else emb_array.flatten()
    
    def create_demographic_embedding(self, demographics: Dict) -> np.ndarray:
        terms = DemographicContextGenerator.generate_demographic_context(demographics) if demographics else []
        return self._encode_or_zero(terms)
    
    def create_interest_embedding(self, interests: List[str]) -> np.ndarray:
        return self._encode_or_zero(interests)
    
    def fuse_embeddings(self, 
                        interest_emb: np.ndarray, 
                        demographic_emb: np.ndarray) -> np.ndarray:
       
        w = {"interest": 0.8, "demographic": 0.2}

        return interest_emb * w["interest"] + demographic_emb * w["demographic"]
    
    def create_fused_embedding(self, interests: List[str], demographics: Dict) -> np.ndarray:
        return self.fuse_embeddings(
            self.create_interest_embedding(interests),
            self.create_demographic_embedding(demographics)
            )

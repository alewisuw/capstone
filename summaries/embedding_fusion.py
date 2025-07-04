import numpy as np
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
from demographic_enums import DemographicContextGenerator

class EmbeddingFusion:
    """
    Implements various strategies for fusing demographic and interest embeddings
    """
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = 384  # For all-MiniLM-L6-v2
    
    def create_demographic_embedding(self, demographics: Dict) -> np.ndarray:
        """
        Create a single embedding vector from demographic information
        """
        if not demographics:
            # Return zero vector if no demographics
            return np.zeros(self.embedding_dim)
        
        # Generate demographic context terms
        demographic_terms = DemographicContextGenerator.generate_demographic_context(demographics)
        
        if not demographic_terms:
            return np.zeros(self.embedding_dim)
        
        # Create embedding for demographic terms
        demographic_embedding = self.model.encode(demographic_terms)  # type: ignore
        
        # Average the embeddings if multiple terms
        if len(demographic_terms) > 1:
            return np.mean(demographic_embedding, axis=0)
        else:
            return demographic_embedding.flatten()  # type: ignore
    
    def create_interest_embedding(self, interests: List[str]) -> np.ndarray:
        """
        Create a single embedding vector from interest tags
        """
        if not interests:
            return np.zeros(self.embedding_dim)
        
        # Create embedding for interests
        interest_embedding = self.model.encode(interests)  # type: ignore
        
        # Average the embeddings if multiple interests
        if len(interests) > 1:
            return np.mean(interest_embedding, axis=0)
        else:
            return interest_embedding.flatten()  # type: ignore
    
    def fuse_embeddings(self, 
                       interest_embedding: np.ndarray, 
                       demographic_embedding: np.ndarray,
                       strategy: str = "weighted_average",
                       weights: Optional[Dict[str, float]] = None) -> np.ndarray:
        """
        Fuse interest and demographic embeddings using different strategies
        
        Args:
            interest_embedding: Interest embedding vector
            demographic_embedding: Demographic embedding vector
            strategy: Fusion strategy ('concat', 'weighted_concat', 'average', 'weighted_average', 'attention')
            weights: Dictionary with 'interest' and 'demographic' weights (for weighted strategies)
        """
        
        if strategy == "concat":
            # Simple concatenation (doubles the vector size)
            return np.concatenate([interest_embedding, demographic_embedding])
        
        elif strategy == "weighted_concat":
            # Weighted concatenation
            default_weights = {"interest": 0.7, "demographic": 0.3}
            if weights:
                default_weights.update(weights)
            
            weighted_interest = interest_embedding * default_weights["interest"]
            weighted_demographic = demographic_embedding * default_weights["demographic"]
            return np.concatenate([weighted_interest, weighted_demographic])
        
        elif strategy == "average":
            # Simple average
            return (interest_embedding + demographic_embedding) / 2
        
        elif strategy == "weighted_average":
            # Weighted average
            default_weights = {"interest": 0.7, "demographic": 0.3}
            if weights:
                default_weights.update(weights)
            
            return (interest_embedding * default_weights["interest"] + 
                   demographic_embedding * default_weights["demographic"])
        
        elif strategy == "attention":
            # Simple attention mechanism
            # Calculate attention weights based on vector magnitudes
            interest_norm = np.linalg.norm(interest_embedding)
            demographic_norm = np.linalg.norm(demographic_embedding)
            
            total_norm = interest_norm + demographic_norm
            if total_norm == 0:
                return np.zeros(self.embedding_dim)
            
            attention_weights = {
                "interest": interest_norm / total_norm,
                "demographic": demographic_norm / total_norm
            }
            
            return (interest_embedding * attention_weights["interest"] + 
                   demographic_embedding * attention_weights["demographic"])
        
        else:
            raise ValueError(f"Unknown fusion strategy: {strategy}")
    
    def create_fused_embedding(self, 
                             interests: List[str], 
                             demographics: Dict,
                             strategy: str = "weighted_average",
                             weights: Optional[Dict[str, float]] = None) -> np.ndarray:
        """
        Create a fused embedding from interests and demographics
        
        Args:
            interests: List of interest tags
            demographics: Dictionary of demographic information
            strategy: Fusion strategy
            weights: Weights for weighted strategies
        
        Returns:
            Fused embedding vector
        """
        # Create individual embeddings
        interest_embedding = self.create_interest_embedding(interests)
        demographic_embedding = self.create_demographic_embedding(demographics)
        
        # Fuse them
        return self.fuse_embeddings(interest_embedding, demographic_embedding, strategy, weights)
    
    def create_multi_strategy_embeddings(self, 
                                       interests: List[str], 
                                       demographics: Dict) -> Dict[str, np.ndarray]:
        """
        Create embeddings using multiple fusion strategies for comparison
        """
        interest_embedding = self.create_interest_embedding(interests)
        demographic_embedding = self.create_demographic_embedding(demographics)
        
        strategies = {
            "interest_only": interest_embedding,
            "demographic_only": demographic_embedding,
            "average": self.fuse_embeddings(interest_embedding, demographic_embedding, "average"),
            "weighted_average": self.fuse_embeddings(interest_embedding, demographic_embedding, "weighted_average"),
            "attention": self.fuse_embeddings(interest_embedding, demographic_embedding, "attention")
        }
        
        return strategies
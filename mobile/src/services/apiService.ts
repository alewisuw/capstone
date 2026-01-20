import api from '../config/api';
import type {
  UserProfile,
  RecommendationResponse,
  HealthStatus,
  BillRecommendation,
} from '../types';

export const getHealth = async (): Promise<HealthStatus> => {
  try {
    const response = await api.get<HealthStatus>('/health');
    return response.data;
  } catch (error) {
    console.error('Error fetching health:', error);
    throw error;
  }
};

export const getProfiles = async (): Promise<string[]> => {
  try {
    const response = await api.get<string[]>('/api/profiles');
    return response.data;
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
};

export const getProfile = async (username: string): Promise<UserProfile> => {
  try {
    const response = await api.get<UserProfile>(`/api/profiles/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const getRecommendations = async (
  username: string, 
  limit: number = 5
): Promise<RecommendationResponse> => {
  try {
    const response = await api.get<RecommendationResponse>(
      `/api/recommendations/${username}`, 
      {
        params: { limit },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
};

export const searchBills = async (
  query: string,
  limit: number = 3
): Promise<BillRecommendation[]> => {
  try {
    const response = await api.get<BillRecommendation[]>('/api/search', {
      params: { q: query, limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching bills:', error);
    throw error;
  }
};

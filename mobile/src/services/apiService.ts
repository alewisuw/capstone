import axios from 'axios';
import api from '../config/api';
import type {
  UserProfile,
  RecommendationResponse,
  HealthStatus,
  BillRecommendation,
  MyProfileRecord,
  DistrictMpVote,
} from '../types';

type UserProfilePayload = {
  username: string;
  email: string;
  interests: string[];
  demographics: Record<string, string>;
  onboarded: boolean;
};


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
  limit: number = 20,
  offset: number = 0
): Promise<RecommendationResponse> => {
  try {
    const response = await api.get<RecommendationResponse>(
      `/api/recommendations/${username}`, 
      {
        params: { limit, offset },
      }
    );
    return response.data;
  } catch (error) {
    console.warn('Error fetching recommendations:', error);
    throw error;
  }
};

export const getRecommendationsRecent = async (
  username: string,
  limit: number = 50
): Promise<RecommendationResponse> => {
  try {
    const response = await api.get<RecommendationResponse>(
      `/api/recommendations/${username}/recent`,
      {
        params: { limit },
      }
    );
    return response.data;
  } catch (error) {
    console.warn('Error fetching recommendations (recent):', error);
    throw error;
  }
};

export const getMyProfile = async (token: string): Promise<MyProfileRecord> => {
  try {
    const response = await api.get<MyProfileRecord>('/api/me/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status !== 404) {
      console.error('Error fetching profile:', error);
    }
    throw error;
  }
};

export const putMyProfile = async (
  profile: UserProfilePayload,
  token: string
): Promise<MyProfileRecord> => {
  try {
    const response = await api.put<MyProfileRecord>('/api/me/profile', profile, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

export const getMyRecommendations = async (
  token: string,
  limit: number = 20,
  offset: number = 0
): Promise<RecommendationResponse> => {
  try {
    const response = await api.get<RecommendationResponse>('/api/me/recommendations', {
      params: { limit, offset },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.warn('Error fetching recommendations:', error);
    throw error;
  }
};

export const getMyRecommendationsRecent = async (
  token: string,
  limit: number = 50
): Promise<RecommendationResponse> => {
  try {
    const response = await api.get<RecommendationResponse>('/api/me/recommendations/recent', {
      params: { limit },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.warn('Error fetching recommendations (recent):', error);
    throw error;
  }
};

export const getMySaved = async (
  token: string
): Promise<BillRecommendation[]> => {
  try {
    const response = await api.get<BillRecommendation[]>('/api/me/saved', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching saved bills:', error);
    throw error;
  }
};

export const getMyDistrictVote = async (
  token: string,
  bill_id: number
): Promise<DistrictMpVote> => {
  try {
    const response = await api.get<DistrictMpVote>(`/api/me/bills/${bill_id}/district-vote`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching district vote:', error);
    throw error;
  }
};

export const saveBill = async (
  token: string,
  bill_id: number
): Promise<number[]> => {
  try {
    const response = await api.post<number[]>(
      '/api/me/saved',
      { bill_id },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving bill:', error);
    throw error;
  }
};

export const unsaveBill = async (
  token: string,
  bill_id: number
): Promise<number[]> => {
  try {
    const response = await api.delete<number[]>(
      `/api/me/saved/${bill_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error unsaving bill:', error);
    throw error;
  }
};

export const deleteMyAccount = async (token: string): Promise<void> => {
  try {
    await api.delete('/api/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

export const searchBills = async (
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<BillRecommendation[]> => {
  try {
    const response = await api.get<BillRecommendation[]>('/api/search/', {
      params: { q: query, limit, offset },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching bills:', error);
    throw error;
  }
};

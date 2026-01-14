// API Response Types
export interface BillRecommendation {
  bill_id: number;
  title: string;
  summary: string;
  score?: number | null;
}

export interface UserProfile {
  name: string;
  interests: string[];
  demographics: {
    age?: string;
    gender_identity?: string;
    ethnicity_racial_identity?: string;
    indigenous_status?: string;
    sexual_orientation?: string;
    income_range?: string;
    disability_status?: string;
    "income_range_(annual,_before_tax)"?: string;
    disability_status_functional_ability?: string;
    [key: string]: string | undefined;
  };
}

export interface RecommendationResponse {
  recommendations: BillRecommendation[];
  user_profile: UserProfile;
}

export interface HealthStatus {
  status: string;
}

export type RecommendationMethod = 'fused' | 'average' | 'individual' | 'blended';

// Navigation Types
export type RootStackParamList = {
  HomeMain: undefined;
  RecommendationsMain: { username?: string };
  BillDetail: { bill: BillRecommendation };
};

export type RootTabParamList = {
  Home: undefined;
  Recommendations: { username?: string };
  Profile: undefined;
};

export type AuthStackParamList = {
  AuthLanding: undefined;
  Login: undefined;
  SignUp: undefined;
  Instructions: undefined;
  BasicInfo: undefined;
};

// Component Props Types
export interface BillCardProps {
  bill: BillRecommendation;
  onPress: () => void;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

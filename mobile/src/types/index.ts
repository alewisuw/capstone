// API Response Types
export interface BillRecommendation {
  bill_id: number;
  bill_number?: string | null;
  title: string;
  summary: string;
  score?: number | null;
  url?: string | null;
  tags?: string[] | null;
  parliament_session?: string | null;
  last_updated?: string | null;
  status_code?: string | null;
  is_new_bill?: number | boolean | null;
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

export interface MyProfileRecord {
  user_id: string;
  username: string;
  email: string;
  interests: string[];
  demographics: Record<string, string>;
  onboarded: boolean;
  saved_bill_ids?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RecommendationResponse {
  recommendations: BillRecommendation[];
}

export interface DistrictMpVote {
  bill_id: number;
  electoral_district?: string | null;
  electoral_district_id?: string | null;
  available: boolean;
  mp_name?: string | null;
  mp_headshot_url?: string | null;
  mp_party?: string | null;
  vote?: string | null;
  vote_result?: string | null;
  vote_date?: string | null;
  position?: string | null;
}

export interface HealthStatus {
  status: string;
}


// Navigation Types
export type RootStackParamList = {
  HomeMain: undefined;
  RecommendationsMain: { username?: string };
  LearnMain: undefined;
  LearnDetail: { topic: 'billboard' | 'legislation' | 'governance' };
  LearnModuleDetail: { topic: 'billboard' | 'legislation' | 'governance'; moduleId: string };
  SavedMain: undefined;
  ProfileMain: undefined;
  EditProfile: undefined;
  BillDetail: { bill: BillRecommendation };
};

export type RootTabParamList = {
  Home: undefined;
  Recommendations: { username?: string };
  Learn: undefined;
  Saved: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  AuthLanding: undefined;
  Login: undefined;
  SignUp: undefined;
  VerifyEmail: undefined;
  Instructions: undefined;
  Interests: undefined;
  BasicInfo: { interests: string[] };
  ElectoralDistrict: { demographics: Record<string, string>; interests: string[] };
};

// Component Props Types
export interface BillCardProps {
  bill: BillRecommendation;
  onPress: () => void;
  isSaved?: boolean;
  onToggleSave?: (bill: BillRecommendation) => void;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

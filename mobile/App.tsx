import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import Ionicons from './src/components/Icon';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';

import HomeScreen from './src/screens/HomeScreen';
import RecommendationsScreen from './src/screens/RecommendationsScreen';
import LearnScreen from './src/screens/LearnScreen';
import LearnDetailScreen from './src/screens/LearnDetailScreen';
import LearnModuleDetailScreen from './src/screens/LearnModuleDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import BillDetailScreen from './src/screens/BillDetailScreen';
import SavedScreen from './src/screens/SavedScreen';
import AuthLandingScreen from './src/screens/auth/AuthLandingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import VerifyEmailScreen from './src/screens/auth/VerifyEmailScreen';
import InstructionsScreen from './src/screens/auth/InstructionsScreen';
import BasicInfoScreen from './src/screens/auth/BasicInfoScreen';
import ElectoralDistrictScreen from './src/screens/auth/ElectoralDistrictScreen';
import InterestsScreen from './src/screens/auth/InterestsScreen';
import type { AuthStackParamList, RootStackParamList, RootTabParamList } from './src/types';
import { theme } from './src/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SavedProvider } from './src/context/SavedContext';

if (__DEV__) {
  LogBox.ignoreLogs([
    'Using an insecure random number generator, this should only happen when running in a debugger without support for crypto.getRandomValues',
    'Encountered two children with the same key',
  ]);

  const originalHandler = (globalThis as any).ErrorUtils?.getGlobalHandler();
  (globalThis as any).ErrorUtils?.setGlobalHandler((error: any, isFatal: boolean) => {
    if (error?.message?.includes('Encountered two children with the same key')) {
      console.warn(error.message);
      return;
    }
    originalHandler?.(error, isFatal);
  });
}

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();

type HomeStackProps = StackScreenProps<RootTabParamList, 'Home'>;
type RecommendationsStackProps = StackScreenProps<RootTabParamList, 'Recommendations'>;

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BillDetail" 
        component={BillDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function RecommendationsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="RecommendationsMain" 
        component={RecommendationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BillDetail" 
        component={BillDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function LearnStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LearnMain"
        component={LearnScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LearnDetail"
        component={LearnDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LearnModuleDetail"
        component={LearnModuleDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function SavedStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SavedMain" 
        component={SavedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="BillDetail" 
        component={BillDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="AuthLanding" component={AuthLandingScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <AuthStack.Screen name="Instructions" component={InstructionsScreen} />
      <AuthStack.Screen name="BasicInfo" component={BasicInfoScreen} />
      <AuthStack.Screen name="ElectoralDistrict" component={ElectoralDistrictScreen} />
      <AuthStack.Screen name="Interests" component={InterestsScreen} />
    </AuthStack.Navigator>
  );
}

function AppShell() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  if (!user) {
    return <AuthFlow />;
  }

  return (
    <Tab.Navigator
      initialRouteName="Recommendations"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Recommendations') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Learn') {
            iconName = focused ? 'school' : 'school-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: '#9a9a9a',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderLight,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 5,
          height: 56 + Math.max(insets.bottom, 8),
        },
      })}
    >
      <Tab.Screen name="Recommendations" component={RecommendationsStack} options={{ title: 'Home' }} />
      <Tab.Screen name="Learn" component={LearnStack} />
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Search' }} />
      <Tab.Screen name="Saved" component={SavedStack} options={{ title: 'Saved' }} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AuthProvider>
          <SavedProvider>
            <AppShell />
          </SavedProvider>
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

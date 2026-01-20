import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';

import HomeScreen from './src/screens/HomeScreen';
import RecommendationsScreen from './src/screens/RecommendationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BillDetailScreen from './src/screens/BillDetailScreen';
import AuthLandingScreen from './src/screens/auth/AuthLandingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import InstructionsScreen from './src/screens/auth/InstructionsScreen';
import BasicInfoScreen from './src/screens/auth/BasicInfoScreen';
import type { AuthStackParamList, RootStackParamList, RootTabParamList } from './src/types';
import { theme } from './src/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';

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
        options={{ 
          title: 'Bill Details',
          headerStyle: { backgroundColor: theme.colors.accentDark },
          headerTintColor: '#fff',
        }}
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
        options={{ 
          title: 'Bill Details',
          headerStyle: { backgroundColor: theme.colors.accentDark },
          headerTintColor: '#fff',
        }}
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
      <AuthStack.Screen name="Instructions" component={InstructionsScreen} />
      <AuthStack.Screen name="BasicInfo" component={BasicInfoScreen} />
    </AuthStack.Navigator>
  );
}

function AppShell() {
  const { user } = useAuth();

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
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen name="Recommendations" component={RecommendationsStack} options={{ title: 'Home' }} />
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Search' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

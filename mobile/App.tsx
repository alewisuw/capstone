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
import type { RootStackParamList, RootTabParamList } from './src/types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

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
          headerStyle: { backgroundColor: '#6366f1' },
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
          headerStyle: { backgroundColor: '#6366f1' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
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
            tabBarActiveTintColor: '#6366f1',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#ffffff',
              borderTopWidth: 1,
              borderTopColor: '#e5e7eb',
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Search' }} />
          <Tab.Screen name="Recommendations" component={RecommendationsStack} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

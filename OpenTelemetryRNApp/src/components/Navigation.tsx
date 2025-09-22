import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import HomeScreen from './HomeScreen';
import EventsScreen from './EventsScreen';
import { trackUserClick, telemetryService } from '../services/TelemetryService';

type Screen = 'home' | 'events';

const Navigation: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const navigateToScreen = (screen: Screen) => {
    if (screen === currentScreen) return;

    trackUserClick('navigation_tab', 'Navigation', {
      from_screen: currentScreen,
      to_screen: screen,
    });

    telemetryService.logCustomEvent({
      name: 'screen_navigation',
      category: 'navigation',
      metadata: {
        from: currentScreen,
        to: screen,
        navigation_type: 'tab',
      },
    });

    setCurrentScreen(screen);
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'events':
        return <EventsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {renderCurrentScreen()}
      </View>
      
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentScreen === 'home' && styles.activeNavButton,
          ]}
          onPress={() => navigateToScreen('home')}
        >
          <Text
            style={[
              styles.navButtonText,
              currentScreen === 'home' && styles.activeNavButtonText,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.navButton,
            currentScreen === 'events' && styles.activeNavButton,
          ]}
          onPress={() => navigateToScreen('events')}
        >
          <Text
            style={[
              styles.navButtonText,
              currentScreen === 'events' && styles.activeNavButtonText,
            ]}
          >
            Events
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  activeNavButton: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeNavButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Navigation;

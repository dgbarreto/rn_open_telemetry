import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { telemetryManager, defaultTelemetryConfig } from './src/config/telemetry';
import Navigation from './src/components/Navigation';
import { telemetryService } from './src/services/TelemetryService';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize immediately without async
    initializeTelemetry();
    
    // Force app to start after 2 seconds max
    const timeout = setTimeout(() => {
      console.log('🚀 Force starting app after timeout');
      setIsInitializing(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  const initializeTelemetry = () => {
    try {
      console.log('🔧 Starting telemetry initialization...');
      
      // Initialize OpenTelemetry (synchronous)
      telemetryManager.initialize(defaultTelemetryConfig);

      console.log('✅ Telemetry initialized, starting app');
      setIsInitializing(false);

      // Log startup event after app loads
      setTimeout(() => {
        try {
          telemetryService.logCustomEvent({
            name: 'app_startup',
            category: 'lifecycle',
            metadata: {
              app_version: '1.0.0',
              platform: 'react-native',
              environment: 'development',
            },
          });
          console.log('📊 Startup event logged');
        } catch (error) {
          console.warn('⚠️ Failed to log startup event:', error);
        }
      }, 500);

    } catch (error) {
      console.warn('⚠️ Telemetry initialization failed, starting app anyway:', error);
      setIsInitializing(false);
    }
  };

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing OpenTelemetry...</Text>
      </View>
    );
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Telemetry initialization failed, but the app is still functional.
        </Text>
        <Navigation />
        <StatusBar style="auto" />
      </View>
    );
  }

  // Normal app flow
  return (
    <View style={styles.container}>
      <Navigation />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    margin: 20,
    padding: 16,
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: 8,
    textAlign: 'center',
  },
});

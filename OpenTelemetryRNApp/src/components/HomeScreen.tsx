import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { 
  telemetryService, 
  trackUserClick, 
  trackScreenView, 
  trackApiError 
} from '../services/TelemetryService';

const HomeScreen: React.FC = () => {
  const [counter, setCounter] = useState(0);
  const [inputText, setInputText] = useState('');
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Track screen view when component mounts
    trackScreenView('HomeScreen');
  }, []);

  const handleIncrement = () => {
    setCounter(prev => prev + 1);
    trackUserClick('increment_button', 'HomeScreen', {
      counter_value: counter + 1,
      action_type: 'increment',
    });
  };

  const handleDecrement = () => {
    setCounter(prev => prev - 1);
    trackUserClick('decrement_button', 'HomeScreen', {
      counter_value: counter - 1,
      action_type: 'decrement',
    });
  };

  const handleReset = () => {
    setCounter(0);
    trackUserClick('reset_button', 'HomeScreen', {
      previous_value: counter,
      action_type: 'reset',
    });
  };

  const handleTestConnectivity = () => {
    telemetryService.testConnectivity();
    trackUserClick('test_connectivity_button', 'HomeScreen', {
      action_type: 'test_connectivity',
    });
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (text.length > 0 && text.length % 5 === 0) {
      // Track every 5 characters typed
      telemetryService.logCustomEvent({
        name: 'text_input_milestone',
        category: 'user_interaction',
        metadata: {
          text_length: text.length,
          milestone: Math.floor(text.length / 5),
        },
      });
    }
  };

  const simulateApiCall = async () => {
    setApiStatus('loading');
    trackUserClick('api_call_button', 'HomeScreen');

    try {
      // Simulate API call with tracking
      await telemetryService.trackOperation(
        'simulate_api_call',
        async (span) => {
          span.addEvent('api_call_started');
          
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Randomly succeed or fail
          const success = Math.random() > 0.3;
          
          if (success) {
            span.addEvent('api_call_succeeded');
            telemetryService.logApiCall({
              method: 'GET',
              url: 'https://api.example.com/data',
              statusCode: 200,
              duration: 2000,
            });
            setApiStatus('success');
          } else {
            const error = 'Network timeout';
            span.addEvent('api_call_failed', { error });
            trackApiError('https://api.example.com/data', 'GET', error, 408);
            setApiStatus('error');
            throw new Error(error);
          }
        },
        {
          api_type: 'simulation',
          user_initiated: true,
        }
      );
    } catch (error) {
      console.error('API call failed:', error);
    }
  };

  const simulateError = () => {
    trackUserClick('error_button', 'HomeScreen');
    
    try {
      // Intentionally cause an error
      const obj: any = null;
      obj.someProperty.nestedProperty = 'This will fail';
    } catch (error) {
      telemetryService.logError({
        errorType: 'NullPointerError',
        message: (error as Error).message,
        stack: (error as Error).stack,
        screen: 'HomeScreen',
        metadata: {
          intentional: true,
          error_source: 'user_action',
        },
      });
      
      Alert.alert('Error Logged', 'An intentional error was logged to demonstrate error tracking.');
    }
  };

  const showAlert = () => {
    trackUserClick('alert_button', 'HomeScreen');
    
    telemetryService.logCustomEvent({
      name: 'alert_shown',
      category: 'ui_interaction',
      metadata: {
        alert_type: 'info',
        trigger: 'button_click',
      },
    });
    
    Alert.alert(
      'Hello!',
      'This alert was tracked with OpenTelemetry',
      [
        {
          text: 'OK',
          onPress: () => {
            telemetryService.logCustomEvent({
              name: 'alert_dismissed',
              category: 'ui_interaction',
              metadata: {
                alert_type: 'info',
                action: 'ok_pressed',
              },
            });
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>OpenTelemetry React Native Demo</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Counter Example</Text>
        <Text style={styles.counter}>Count: {counter}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={handleIncrement}>
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleDecrement}>
            <Text style={styles.buttonText}>-</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleReset}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.button, styles.testButton]} onPress={handleTestConnectivity}>
          <Text style={styles.buttonText}>🧪 Test Telemetry</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text Input Tracking</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Type here (tracked every 5 characters)"
          value={inputText}
          onChangeText={handleTextChange}
          multiline
        />
        <Text style={styles.inputInfo}>Characters: {inputText.length}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Call Simulation</Text>
        <TouchableOpacity 
          style={[styles.button, styles.apiButton, apiStatus === 'loading' && styles.disabledButton]} 
          onPress={simulateApiCall}
          disabled={apiStatus === 'loading'}
        >
          <Text style={styles.buttonText}>
            {apiStatus === 'loading' ? 'Calling API...' : 'Simulate API Call'}
          </Text>
        </TouchableOpacity>
        {apiStatus !== 'idle' && (
          <Text style={[
            styles.statusText, 
            apiStatus === 'success' ? styles.successText : 
            apiStatus === 'error' ? styles.errorText : styles.loadingText
          ]}>
            Status: {apiStatus}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Tracking</Text>
        <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={simulateError}>
          <Text style={styles.buttonText}>Simulate Error</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>UI Interactions</Text>
        <TouchableOpacity style={styles.button} onPress={showAlert}>
          <Text style={styles.buttonText}>Show Alert</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  counter: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  testButton: {
    backgroundColor: '#5856D6',
    marginTop: 10,
    alignSelf: 'center',
    width: '80%',
  },
  apiButton: {
    backgroundColor: '#34C759',
    width: '100%',
  },
  errorButton: {
    backgroundColor: '#FF9500',
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputInfo: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  statusText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  successText: {
    color: '#34C759',
  },
  errorText: {
    color: '#FF3B30',
  },
  loadingText: {
    color: '#FF9500',
  },
});

export default HomeScreen;

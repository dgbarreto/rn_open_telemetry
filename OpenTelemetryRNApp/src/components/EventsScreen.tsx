import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { trackUserClick, trackScreenView, telemetryService } from '../services/TelemetryService';

interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: string;
  description: string;
}

const EventsScreen: React.FC = () => {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);

  useEffect(() => {
    trackScreenView('EventsScreen');
    
    // Simulate some historical events for demonstration
    const mockEvents: TelemetryEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        type: 'user_interaction',
        description: 'Button clicked on HomeScreen',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        type: 'api_call',
        description: 'GET /api/data - 200 OK',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 180000).toISOString(),
        type: 'screen_view',
        description: 'Viewed HomeScreen',
      },
    ];
    
    setEvents(mockEvents);
  }, []);

  const handleRefresh = () => {
    trackUserClick('refresh_button', 'EventsScreen');
    
    telemetryService.logCustomEvent({
      name: 'events_refreshed',
      category: 'user_action',
      metadata: {
        events_count: events.length,
        refresh_source: 'manual',
      },
    });

    // Add a new mock event to show the refresh working
    const newEvent: TelemetryEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: 'user_interaction',
      description: 'Events list refreshed',
    };

    setEvents(prev => [newEvent, ...prev]);
  };

  const handleEventPress = (event: TelemetryEvent) => {
    trackUserClick('event_item', 'EventsScreen', {
      event_id: event.id,
      event_type: event.type,
    });

    telemetryService.logCustomEvent({
      name: 'event_details_viewed',
      category: 'navigation',
      metadata: {
        event_id: event.id,
        event_type: event.type,
      },
    });
  };

  const clearEvents = () => {
    trackUserClick('clear_events_button', 'EventsScreen');
    
    telemetryService.logCustomEvent({
      name: 'events_cleared',
      category: 'user_action',
      metadata: {
        cleared_count: events.length,
      },
    });

    setEvents([]);
  };

  const renderEventItem = ({ item }: { item: TelemetryEvent }) => (
    <TouchableOpacity
      style={styles.eventItem}
      onPress={() => handleEventPress(item)}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventType}>{item.type}</Text>
        <Text style={styles.eventTime}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={styles.eventDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Telemetry Events</Text>
      <Text style={styles.subtitle}>
        This screen shows mock telemetry events. In a real app, these would come from your telemetry backend.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleRefresh}>
          <Text style={styles.buttonText}>Refresh Events</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearEvents}
        >
          <Text style={styles.buttonText}>Clear Events</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        style={styles.eventsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No events to display</Text>
            <Text style={styles.emptySubtext}>
              Go back to the Home screen and interact with the app to generate events.
            </Text>
          </View>
        )}
      />
    </View>
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
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    textTransform: 'capitalize',
  },
  eventTime: {
    fontSize: 12,
    color: '#666',
  },
  eventDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EventsScreen;

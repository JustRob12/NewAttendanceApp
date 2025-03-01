import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';

const ReportsScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Attendance Reports</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Class Reports</Text>
        <Text style={styles.emptyText}>No classes to generate reports</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Reports</Text>
        <Text style={styles.emptyText}>No student attendance data available</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export default ReportsScreen; 
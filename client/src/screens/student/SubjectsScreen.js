import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

const SubjectsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Subjects</Text>
      <Text style={styles.emptyText}>Subjects screen content will be implemented soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default SubjectsScreen; 
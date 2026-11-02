import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface ProfileCardProps {
  nombre: string;
  profesion: string;
  ciudad: string;
  imagen: string;
}

export default function ProfileCard({ nombre, profesion, ciudad, imagen }: ProfileCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: imagen }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{nombre}</Text>
        <Text style={styles.text}>{profesion}</Text>
        <Text style={styles.text}>{ciudad}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  }
});
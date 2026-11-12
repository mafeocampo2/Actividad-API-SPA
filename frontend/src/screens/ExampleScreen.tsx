import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, Alert, ScrollView } from 'react-native';
import ProfileCard from '../components/ProfileCard';

export default function ExampleScreen() {
  const [contador, setContador] = useState(0);

  const mostrarAlerta = () => {
    Alert.alert(
      "Alerta personalizada",
      "Este es el mensaje que querías mostrar.",
      [
        { text: "OK", onPress: () => console.log("OK presionado") }
      ]
    );
  };

  const incrementar = () => setContador(contador + 1);
  
  const disminuir = () => {
    if (contador > 0) {
      setContador(contador - 1);
    }
  };

  const reiniciar = () => setContador(0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Mi Aplicación</Text>
      <Text style={styles.mensaje}>Este es el mensaje principal de la pantalla.</Text>
      
      <Button 
        title="Mostrar Alerta" 
        onPress={mostrarAlerta} 
      />

      <View style={styles.contadorContainer}>
        <Text style={styles.contadorTexto}>Contador: {contador}</Text>
        
        {contador === 10 && (
          <Text style={styles.mensajeAlerta}>Llegamos a 10 !!!!!</Text>
        )}

        <View style={styles.botonesContainer}>
          <Button title="Disminuir" onPress={disminuir} />
          <Button title="Reiniciar" onPress={reiniciar} />
          <Button title="Aumentar" onPress={incrementar} />
        </View>
      </View>

      <View style={styles.cardsContainer}>
        <ProfileCard 
          nombre="Carlos Restrepo"
          profesion="Ingeniero de Software"
          ciudad="Medellín"
          imagen="https://randomuser.me/api/portraits/men/11.jpg"
        />
        <ProfileCard 
          nombre="Laura Martínez"
          profesion="Diseñadora Gráfica"
          ciudad="Bogotá"
          imagen="https://randomuser.me/api/portraits/women/44.jpg"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mensaje: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  contadorContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#e6f7ff',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  contadorTexto: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  mensajeAlerta: {
    fontSize: 18,
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  botonesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cardsContainer: {
    width: '100%',
    marginTop: 30,
  }
});
import React, { useEffect, useState } from 'react';
import { FlatList, Text, View, StyleSheet, Button, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';

export interface Dish {
  id: string;
  name: string;
  description: string;
  course: string;
  price: string;
}

const initialDishes: Dish[] = [
  { id: '1', name: 'Spaghetti', description: 'Classic Italian pasta dish', course: 'Mains', price: '12.99' },
  { id: '2', name: 'Cheesecake', description: 'Rich and creamy dessert', course: 'Desserts', price: '6.99' },
];

const Stack = createStackNavigator();

const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin') {
      navigation.navigate('DishesList');
      setError('');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
    </View>
  );
};

const DishesListScreen = ({ navigation }: any) => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [filter, setFilter] = useState(''); 

  const loadDishes = async () => {
    try {
      const storedDishes = await AsyncStorage.getItem('dishes');
      if (storedDishes) {
        setDishes(JSON.parse(storedDishes));
      } else {
        setDishes(initialDishes);
        await AsyncStorage.setItem('dishes', JSON.stringify(initialDishes));
      }
    } catch (error) {
      console.error('Failed to load dishes:', error);
    }
  };

  useEffect(() => {
    loadDishes();
  }, []);

  const refreshDishes = async () => {
    const storedDishes = await AsyncStorage.getItem('dishes');
    if (storedDishes) {
      setDishes(JSON.parse(storedDishes));
    }
  };

  const handleRemoveDish = async (id: string) => {
    try {
      const storedDishes = await AsyncStorage.getItem('dishes');
      const dishes = storedDishes ? JSON.parse(storedDishes) : [];
      const updatedDishes = dishes.filter((dish: Dish) => dish.id !== id);
      await AsyncStorage.setItem('dishes', JSON.stringify(updatedDishes));
      refreshDishes();
      Alert.alert('Dish removed successfully!');
    } catch (error) {
      console.error('Failed to remove dish:', error);
      Alert.alert('Failed to remove dish. Please try again.');
    }
  };

  const renderDish = ({ item }: { item: Dish }) => (
    <View style={styles.dishItem}>
      <View style={styles.dishDetails}>
        <Text style={styles.dishName}>{item.name}</Text>
        <Text>{item.description}</Text>
        <Text style={styles.dishPrice}>R{item.price}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Edit"
          onPress={() => navigation.navigate('EditDish', { dish: item, refreshDishes })}
          color="#007BFF"
        />
        <Button
          title="Remove"
          onPress={() => handleRemoveDish(item.id)}
          color="red"
        />
      </View>
    </View>
  );

  const filteredDishes = dishes.filter(dish => {
    if (!filter) return true; 
    return dish.course === filter; 
  });

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={filter}
        onValueChange={(itemValue) => setFilter(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="All Courses" value="" />
        <Picker.Item label="Entrée" value="Entrée" />
        <Picker.Item label="Appetizers" value="Appetizers" />
        <Picker.Item label="Dessert" value="Dessert" />
        <Picker.Item label="Sides" value="Sides" />
      </Picker>
      
      <FlatList
        data={filteredDishes} 
        renderItem={renderDish}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.flatListContainer}
      />
      <Button title="Add Dish" onPress={() => navigation.navigate('AddDish', { refreshDishes })} />
    </View>
  );
};

const AddDishScreen = ({ navigation, route }: any) => {
  const { refreshDishes } = route.params;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [course, setCourse] = useState(''); 
  const [price, setPrice] = useState('');

  const handleAddDish = async () => {
    if (!name || !description || !course || !price) {
      Alert.alert('Please fill in all fields.');
      return;
    }

    const newDish: Dish = {
      id: Date.now().toString(),
      name,
      description,
      course,
      price,
    };

    try {
      const storedDishes = await AsyncStorage.getItem('dishes');
      const dishes = storedDishes ? JSON.parse(storedDishes) : [];
      dishes.push(newDish);
      await AsyncStorage.setItem('dishes', JSON.stringify(dishes));
      Alert.alert('Dish added successfully!');
      refreshDishes();
      navigation.navigate('DishesList');
    } catch (error) {
      console.error('Failed to add dish:', error);
      Alert.alert('Failed to add dish. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Dish Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />
      <Picker
        selectedValue={course}
        onValueChange={(itemValue) => setCourse(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select Course" value="" />
        <Picker.Item label="Entrée" value="Entrée" />
        <Picker.Item label="Appetizers" value="Appetizers" />
        <Picker.Item label="Dessert" value="Dessert" />
        <Picker.Item label="Sides" value="Sides" />
      </Picker>
      <TextInput
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button title="Add Dish" onPress={handleAddDish} />
    </View>
  );
};

const EditDishScreen = ({ navigation, route }: any) => {
  const { dish, refreshDishes } = route.params;
  const [name, setName] = useState(dish.name);
  const [description, setDescription] = useState(dish.description);
  const [course, setCourse] = useState(dish.course);
  const [price, setPrice] = useState(dish.price);

  const handleEditDish = async () => {
    if (!name || !description || !course || !price) {
      Alert.alert('Please fill in all fields.');
      return;
    }

    const updatedDish: Dish = {
      id: dish.id,
      name,
      description,
      course,
      price,
    };

    try {
      const storedDishes = await AsyncStorage.getItem('dishes');
      const dishes = storedDishes ? JSON.parse(storedDishes) : [];
      const updatedDishes = dishes.map((d: Dish) => (d.id === dish.id ? updatedDish : d));
      await AsyncStorage.setItem('dishes', JSON.stringify(updatedDishes));
      Alert.alert('Dish updated successfully!');
      refreshDishes(); 
      navigation.navigate('DishesList');
    } catch (error) {
      console.error('Failed to edit dish:', error);
      Alert.alert('Failed to edit dish. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Dish Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />
      <Picker
        selectedValue={course}
        onValueChange={(itemValue) => setCourse(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select Course" value="" />
        <Picker.Item label="Entrée" value="Entrée" />
        <Picker.Item label="Appetizers" value="Appetizers" />
        <Picker.Item label="Dessert" value="Dessert" />
        <Picker.Item label="Sides" value="Sides" />
      </Picker>
      <TextInput
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button title="Update Dish" onPress={handleEditDish} />
    </View>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="DishesList" component={DishesListScreen} />
        <Stack.Screen name="AddDish" component={AddDishScreen} />
        <Stack.Screen name="EditDish" component={EditDishScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  picker: {
    marginBottom: 16,
  },
  flatListContainer: {
    paddingBottom: 20,
  },
  dishItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  dishDetails: {
    flex: 1,
    marginRight: 10,
  },
  dishName: {
    fontWeight: 'bold',
  },
  dishPrice: {
    color: 'green',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
});

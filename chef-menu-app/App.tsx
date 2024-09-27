import React, { useEffect, useState } from 'react';
import { FlatList, Text, View, StyleSheet, Button, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';
import Logo from './logo'
import { colours } from './colours';

export interface Dish {
  id: string;
  name: string;
  description: string;
  course: string;
  price: string;
}

const sampleUsername = "admin";
const samplePassword = "admin";

const initialDishes: Dish[] = [
  { id: '1', name: 'Spaghetti', description: 'Classic Italian pasta dish', course: 'Mains', price: '12.99' },
  { id: '2', name: 'Cheesecake', description: 'Rich and creamy dessert', course: 'Desserts', price: '6.99' },
];

const Stack = createStackNavigator();

const DishesListScreen = ({ navigation, isLoggedIn, setIsLoggedIn }: any) => {
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

  const handleRemoveDish = async (id: string) => {
    if (!isLoggedIn) {
      Alert.alert('Please log in to remove a dish.');
      return;
    }

    try {
      const storedDishes = await AsyncStorage.getItem('dishes');
      const dishes = storedDishes ? JSON.parse(storedDishes) : [];
      const updatedDishes = dishes.filter((dish: Dish) => dish.id !== id);
      await AsyncStorage.setItem('dishes', JSON.stringify(updatedDishes));
      loadDishes();
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
        <Text style={styles.dishDescription}>{item.description}</Text>
        <Text style={styles.dishPrice}>R{item.price}</Text>
      </View>
      {isLoggedIn && (
        <View style={styles.buttonContainer}>
          <Button
            title="Edit"
            onPress={() => navigation.navigate('EditDish', { dish: item, loadDishes })}
            color="#4CAF50"
          />
          <Button
            title="Remove"
            onPress={() => handleRemoveDish(item.id)}
            color="red"
          />
        </View>
      )}
    </View>
  );

  const filteredDishes = dishes.filter(dish => !filter || dish.course === filter);

 
  const calculateAveragePrice = () => {
    if (filteredDishes.length === 0) return 0;
    const total = filteredDishes.reduce((sum, dish) => sum + parseFloat(dish.price), 0);
    return (total / filteredDishes.length).toFixed(2);
  };

  const averagePrice = calculateAveragePrice();

  const handleLogout = () => {
    setIsLoggedIn(false);
    Alert.alert('Logged out successfully!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.averagePriceText}>Average Price: R{averagePrice}</Text>
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

      {isLoggedIn ? (
        <>
          <Button title="Logout" onPress={handleLogout} color="red" />
          <Button title="Add Dish" onPress={() => navigation.navigate('AddDish', { loadDishes })} />
        </>
      ) : (
        <Button title="Login" onPress={() => navigation.navigate('Login')} />
      )}
    </View>
  );
};


const AddDishScreen = ({ navigation, route }: any) => {
  const { loadDishes } = route.params;
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
      loadDishes();
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
      <Button title="Add Dish" onPress={handleAddDish} color="#4CAF50" />
    </View>
  );
};

const EditDishScreen = ({ navigation, route }: any) => {
  const { dish, loadDishes } = route.params;
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
      loadDishes();
      navigation.navigate('DishesList');
    } catch (error) {
      console.error('Failed to edit dish:', error);
      Alert.alert('Failed to edit dish. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
            <TextInput
        placeholder="Price"
        value={price}
        onChangeText={setPrice}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button title="Update Dish" onPress={handleEditDish} color="#4CAF50" />
    </View>
  );
};

const LoginScreen = ({ navigation, setIsLoggedIn }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (username === sampleUsername && password === samplePassword) {
      setIsLoggedIn(true);
      Alert.alert('Login successful!');
      navigation.navigate('DishesList');
    } else {
      Alert.alert('Invalid username or password.');
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
        secureTextEntry
        style={styles.input}
      />
      <Button title="Login" onPress={handleLogin} color="#4CAF50" />
    </View>
  );
};
const getHeaderTitle = (routeName: string) => {
  switch (routeName) {
    case 'DishesList':
      return 'Dishes List';
    case 'AddDish':
      return 'Add Dish';
    case 'EditDish':
      return 'Edit Dish';
    case 'Login':
      return 'Login';
    default:
      return '';
  }
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="DishesList">
        {['DishesList', 'Login', 'AddDish', 'EditDish'].map((name) => (
          <Stack.Screen 
            key={name} 
            name={name} 
            options={({ route }) => ({
              headerTitle: () => (
                <View style={styles.headerContainer}>
                  <Logo />
                  <Text style={styles.headerTitle}>{getHeaderTitle(route.name)}</Text>
                </View>
              ),
              headerTitleAlign: 'center',
              headerStyle: {
                backgroundColor: '#1976D2', 
              },
              headerTintColor: '#fff',
              headerBackTitleVisible: false,
            })}
          >
            {(props) => {
              if (name === 'DishesList') {
                return <DishesListScreen {...props} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />;
              } else if (name === 'Login') {
                return <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />;
              } else if (name === 'AddDish') {
                return <AddDishScreen {...props} />;
              } else if (name === 'EditDish') {
                return <EditDishScreen {...props} />;
              }
              return null;
            }}
          </Stack.Screen>
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
};




const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colours.background,
  },
  dishItem: {
    backgroundColor: colours.dishBackground,
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.5,
    elevation: 5,
  },
  dishDetails: {
    marginBottom: 10,
  },
  dishName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colours.primary, 
  },
  dishDescription: {
    fontSize: 16,
    color: '#555',
  },
  dishPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colours.dishPrice, 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    height: 45,
    borderColor: colours.inputBorder, 
    borderWidth: 2,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 8,
    backgroundColor: colours.dishBackground, 
  },
  flatListContainer: {
    paddingBottom: 20,
  },
  picker: {
    height: 50,
    marginBottom: 20,
    borderColor: colours.inputBorder, 
    borderWidth: 2,
    borderRadius: 8,
    backgroundColor: colours.dishBackground, 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colours.primary, 
    padding: 10,
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 22,
    color: colours.text, 
    marginLeft: 10, 
  },
  averagePriceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2', 
    marginBottom: 10,
  },
});

export default App;

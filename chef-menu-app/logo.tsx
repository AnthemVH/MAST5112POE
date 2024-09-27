import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const Logo = () => {
  return (
    <View style={styles.container}>
      <Image source={require('../chef-menu-app/Christof_Logo.png')} style={styles.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100, 
    height: 100, 
    marginRight: 10, 
  },
});

export default Logo;

import React from 'react';
import {
  View, Text, FlatList,
  TouchableOpacity, StyleSheet, SafeAreaView
} from 'react-native';
import {
  Ionicons, MaterialCommunityIcons,
  FontAwesome5
} from '@expo/vector-icons';

const academicItems = [
  {
    id: '1',
    name: 'CHRISTINE STEGNER',
    icon: <Ionicons name="person-outline" size={24} color="#0057ff" />
  },
//   {
//     id: '2',
//     name: 'TRACY SMITH',
//     icon: <MaterialCommunityIcons name="account-circle-outline" size={24} color="#7b61ff" />
//   },
//   {
//     id: '3',
//     name: 'PATRICIA PARKER',
//     icon: <MaterialCommunityIcons name="account-star-outline" size={24} color="#00bf72" />
//   },
//   {
//     id: '4',
//     name: 'TANESHA MCINTOSH',
//     icon: <FontAwesome5 name="user-alt" size={20} color="#ff6f3c" />
//   },
//   {
//     id: '5',
//     name: 'BRIAN FOSTER',
//     icon: <FontAwesome5 name="user" size={20} color="#e33fb1" />
//   },
//   {
//     id: '6',
//     name: 'WILLIAM VINE',
//     icon: <Ionicons name="person-circle-outline" size={24} color="#00bfff" />
//   }
];

export default function AcademicThings({ navigation }) {
  const handleSelect = (item) => {
    console.log(`Selected ${item.name}`);
    navigation.navigate('StudentMentorcard');

 // Uncomment if screens exist
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelect(item)}>
      <View style={styles.iconWrapper}>
        {item.icon}
      </View>
      <Text style={styles.itemText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#888" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FlatList
          data={academicItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#e6f3ff' },
  container: { padding: 20 },
  itemContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
  },
});

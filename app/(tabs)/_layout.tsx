import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icon = label === 'Play' ? '🎯' : '📊';
  return (
    <View style={styles.tabIcon}>
      <Text style={styles.tabEmoji}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#252b4a',
          borderTopColor: '#4a5568',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#f5c518',
        tabBarInactiveTintColor: '#a0aec0',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Play',
          tabBarIcon: ({ focused }) => <TabIcon label="Play" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => <TabIcon label="Stats" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    color: '#a0aec0',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#f5c518',
  },
});

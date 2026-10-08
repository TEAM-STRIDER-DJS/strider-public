import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'home/index', label: '홈', icon: 'home' },
  { name: 'feed/index', label: '피드', icon: 'list' },
  { name: 'profile/index', label: '프로필', icon: 'person' },
];

function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((r) =>
    TABS.some((t) => t.name === r.name)
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 8,
        paddingBottom: insets.bottom,
        paddingTop: 8,
        paddingHorizontal: 8,
      }}
    >
      {visibleRoutes.map((route) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;

        const isFocused = state.routes[state.index].name === route.name;
        const color = isFocused ? '#6178FD' : '#9FA4B0';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.name}
            onPress={onPress}
            activeOpacity={0.7}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
          >
            <Ionicons
              name={isFocused ? tab.icon : `${tab.icon}-outline`}
              size={22}
              color={color}
            />
            <Text style={{ fontSize: 10, color, marginTop: 3, fontWeight: isFocused ? '600' : '400' }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home/index" />
      <Tabs.Screen name="group/index" options={{ href: null }} />
      <Tabs.Screen name="feed/index" />
      <Tabs.Screen name="community/index" options={{ href: null }} />
      <Tabs.Screen name="profile/index" />
    </Tabs>
  );
}

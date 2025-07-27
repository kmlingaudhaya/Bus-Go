import React from 'react';
import { Stack } from 'expo-router';

export default function TripDetailsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="completed" />
      <Stack.Screen name="active" />
      <Stack.Screen name="scheduled" />
    </Stack>
  );
}
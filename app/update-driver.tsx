import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Navbar from '@/components/Navbar';
import { router, useLocalSearchParams } from 'expo-router';

export default function UpdateDriver() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!id) return;
    setTimeout(() => {
      setForm({
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        license_number: "DL-123456",
        license_class: "MCWG",
        phone_number: "+91-98765-43210",
      });
      setFetching(false);
    }, 500);
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.first_name ||
      !form.last_name ||
      !form.email ||
      !form.license_number
    ) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Driver updated successfully!");
      router.back();
    }, 1000);
  };

  if (fetching) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Navbar title="Update Driver" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Driver</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={form.first_name || ""}
          onChangeText={(v) => handleChange("first_name", v)}
          placeholder="First Name"
        />
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={form.last_name || ""}
          onChangeText={(v) => handleChange("last_name", v)}
          placeholder="Last Name"
        />
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={form.email || ""}
          onChangeText={(v) => handleChange("email", v)}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>License Number *</Text>
        <TextInput
          style={styles.input}
          value={form.license_number || ""}
          onChangeText={(v) => handleChange("license_number", v)}
          placeholder="License Number"
        />
        <Text style={styles.label}>License Class</Text>
        <TextInput
          style={styles.input}
          value={form.license_class || ""}
          onChangeText={(v) => handleChange("license_class", v)}
          placeholder="License Class"
        />
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={form.phone_number || ""}
          onChangeText={(v) => handleChange("phone_number", v)}
          placeholder="Phone Number"
          keyboardType="phone-pad"
        />
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="create" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Update Driver</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8fafc",
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
    borderRadius: 20,
    backgroundColor: "#fff7ed",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#f97316",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#374151",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f97316",
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: "center",
    marginTop: 22,
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
}); 
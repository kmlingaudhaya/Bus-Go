import React, { useState } from "react";
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
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';

export default function AddDriver() {
  const { user } = useAuth();
  // Only allow manager
  if (!user || user.role !== "manager") {
    Alert.alert("Access Denied", "You don't have permission to access this page.");
    router.replace("/(tabs)");
    return null;
  }

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    license_number: "",
    license_class: "",
    date_of_birth: "",
    insurance_policy_number: "",
    phone_number: "",
    address: "",
    manager_id: user?.id ?? null,
    image_url: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.first_name ||
      !form.last_name ||
      !form.email ||
      !form.password ||
      !form.license_number ||
      !form.license_class ||
      !form.date_of_birth ||
      !form.insurance_policy_number ||
      !form.phone_number ||
      !form.address
    ) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Driver created successfully!");
      router.back();
    }, 1000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Navbar title="Add Driver" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Driver</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={styles.input}
          value={form.first_name}
          onChangeText={(v) => handleChange("first_name", v)}
          placeholder="First Name"
        />
        <Text style={styles.label}>Last Name *</Text>
        <TextInput
          style={styles.input}
          value={form.last_name}
          onChangeText={(v) => handleChange("last_name", v)}
          placeholder="Last Name"
        />
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={(v) => handleChange("email", v)}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          value={form.password}
          onChangeText={(v) => handleChange("password", v)}
          placeholder="Password"
          secureTextEntry
        />
        <Text style={styles.label}>License Number *</Text>
        <TextInput
          style={styles.input}
          value={form.license_number}
          onChangeText={(v) => handleChange("license_number", v)}
          placeholder="License Number"
        />
        <Text style={styles.label}>License Class</Text>
        <TextInput
          style={styles.input}
          value={form.license_class}
          onChangeText={(v) => handleChange("license_class", v)}
          placeholder="License Class"
        />
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={form.phone_number}
          onChangeText={(v) => handleChange("phone_number", v)}
          placeholder="Phone Number"
          keyboardType="phone-pad"
        />
        <Text style={styles.label}>Date of Birth *</Text>
        <TextInput
          style={styles.input}
          value={form.date_of_birth}
          onChangeText={(v) => handleChange("date_of_birth", v)}
          placeholder="YYYY-MM-DD"
        />
        <Text style={styles.label}>Insurance Policy Number *</Text>
        <TextInput
          style={styles.input}
          value={form.insurance_policy_number}
          onChangeText={(v) => handleChange("insurance_policy_number", v)}
          placeholder="Insurance Policy Number"
        />
        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          value={form.address}
          onChangeText={(v) => handleChange("address", v)}
          placeholder="Address"
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
              <Ionicons
                name="person-add"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.submitBtnText}>Create Driver</Text>
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
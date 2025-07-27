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

export default function UpdateVehicle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!id) return;
    setTimeout(() => {
      setForm({
        make: "Ashok Leyland",
        model: "Viking",
        year: "2022",
        license_plate: "TN-01-AB-1234",
        vehicle_type: "Bus",
        location: "Chennai",
        status: "available",
      });
      setFetching(false);
    }, 500);
  }, [id]);

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.make || !form.model || !form.year || !form.license_plate) {
      Alert.alert("Missing Fields", "Please fill all required fields.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Vehicle updated successfully!");
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
      <Navbar title="Update Vehicle" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f97316" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Vehicle</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Make *</Text>
        <TextInput
          style={styles.input}
          value={form.make || ""}
          onChangeText={(v) => handleChange("make", v)}
          placeholder="Make"
        />
        <Text style={styles.label}>Model *</Text>
        <TextInput
          style={styles.input}
          value={form.model || ""}
          onChangeText={(v) => handleChange("model", v)}
          placeholder="Model"
        />
        <Text style={styles.label}>Year *</Text>
        <TextInput
          style={styles.input}
          value={form.year || ""}
          onChangeText={(v) => handleChange("year", v)}
          placeholder="Year"
          keyboardType="numeric"
        />
        <Text style={styles.label}>License Plate *</Text>
        <TextInput
          style={styles.input}
          value={form.license_plate || ""}
          onChangeText={(v) => handleChange("license_plate", v)}
          placeholder="License Plate"
          autoCapitalize="characters"
        />
        <Text style={styles.label}>Vehicle Type</Text>
        <TextInput
          style={styles.input}
          value={form.vehicle_type || ""}
          onChangeText={(v) => handleChange("vehicle_type", v)}
          placeholder="Vehicle Type"
        />
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={form.location || ""}
          onChangeText={(v) => handleChange("location", v)}
          placeholder="Location"
        />
        <Text style={styles.label}>Status</Text>
        <TextInput
          style={styles.input}
          value={form.status || ""}
          onChangeText={(v) => handleChange("status", v)}
          placeholder="Status"
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
              <Text style={styles.submitBtnText}>Update Vehicle</Text>
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
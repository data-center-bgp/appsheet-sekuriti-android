import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  View,
  AppState,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { Button, Input, Text, Icon } from "@rneui/themed";

const { width, height } = Dimensions.get("window");

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function signInWithEmail() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Email dan password harus diisi");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    if (error) {
      Alert.alert("Login Gagal", error.message);
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.header}>
            {/* Company Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/logo-bpg.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.welcomeTitle}>Selamat Datang</Text>
            <Text style={styles.welcomeSubtitle}>
              Masuk ke sistem untuk melanjutkan
            </Text>
          </View>

          {/* Login Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Icon name="log-in" type="feather" size={24} color="#007bff" />
              <Text style={styles.formTitle}>Login</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formFields}>
              <Input
                label="Email"
                placeholder="Masukkan alamat email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={{
                  name: "mail",
                  type: "feather",
                  size: 20,
                  color: "#6c757d",
                }}
                inputContainerStyle={styles.inputContainer}
                labelStyle={styles.inputLabel}
                containerStyle={styles.inputWrapper}
              />

              <Input
                label="Password"
                placeholder="Masukkan password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                leftIcon={{
                  name: "lock",
                  type: "feather",
                  size: 20,
                  color: "#6c757d",
                }}
                rightIcon={{
                  name: showPassword ? "eye-off" : "eye",
                  type: "feather",
                  size: 20,
                  color: "#6c757d",
                  onPress: () => setShowPassword(!showPassword),
                }}
                inputContainerStyle={styles.inputContainer}
                labelStyle={styles.inputLabel}
                containerStyle={styles.inputWrapper}
              />
            </View>

            {/* Login Button */}
            <Button
              title={loading ? "Masuk..." : "Masuk"}
              onPress={signInWithEmail}
              disabled={loading}
              loading={loading}
              buttonStyle={styles.loginButton}
              titleStyle={styles.loginButtonText}
              icon={
                loading
                  ? undefined
                  : {
                      name: "log-in",
                      type: "feather",
                      color: "white",
                      size: 18,
                    }
              }
            />

            {/* Help Text */}
            <View style={styles.helpSection}>
              <Text style={styles.helpText}>
                Hubungi administrator jika mengalami masalah login
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 Barokah Perkasa Group</Text>
            <Text style={styles.footerSubtext}>Semua hak dilindungi</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    paddingTop: height * 0.08,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: 32,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
    marginLeft: 8,
  },
  formFields: {
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 8,
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    paddingBottom: 8,
  },
  inputLabel: {
    color: "#495057",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    height: 50,
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  helpSection: {
    alignItems: "center",
    paddingTop: 8,
  },
  helpText: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 16,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    color: "#adb5bd",
  },
});

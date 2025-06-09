import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Text, Card, Button, Icon, Avatar } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackScreenProps } from "../types/navigation";

const { width } = Dimensions.get("window");

type Props = RootStackScreenProps<"Home">;

interface QuickActionItem {
  title: string;
  screen: string;
  icon: string;
  iconType: string;
  color: string;
  params?: any;
}

export default function Homepage({ route, navigation }: Props) {
  const { session } = route.params;

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const quickActions: QuickActionItem[] = [
    {
      title: "Barang Masuk",
      screen: "BarangMasukList",
      icon: "package",
      iconType: "feather",
      color: "#28a745",
    },
    {
      title: "Barang Keluar",
      screen: "BarangKeluarList",
      icon: "truck",
      iconType: "feather",
      color: "#007bff",
    },
    {
      title: "Orang Masuk",
      screen: "OrangMasukList",
      icon: "user-plus",
      iconType: "feather",
      color: "#17a2b8",
    },
    {
      title: "Orang Keluar",
      screen: "OrangKeluarList",
      icon: "user-minus",
      iconType: "feather",
      color: "#6f42c1",
    },
  ];

  const documentActions: QuickActionItem[] = [
    {
      title: "Surat Masuk",
      screen: "SuratMasukList",
      icon: "mail",
      iconType: "feather",
      color: "#fd7e14",
    },
    {
      title: "Surat Keluar",
      screen: "SuratKeluarList",
      icon: "send",
      iconType: "feather",
      color: "#20c997",
    },
    {
      title: "Form Kejadian",
      screen: "FormKejadianList",
      icon: "alert-triangle",
      iconType: "feather",
      color: "#dc3545",
    },
  ];

  const reportActions: QuickActionItem[] = [
    {
      title: "Bunker/Fresh Water",
      screen: "LaporanBunkerFreshWaterList",
      icon: "droplet",
      iconType: "feather",
      color: "#0dcaf0",
    },
    {
      title: "Mobil Tangki Fuel",
      screen: "LaporanMobilTangkiFuelList",
      icon: "truck",
      iconType: "feather",
      color: "#ffc107",
    },
    {
      title: "Travo/Blower",
      screen: "LaporanTravoBlowerList",
      icon: "zap",
      iconType: "feather",
      color: "#e83e8c",
    },
    {
      title: "Laporan Tambat",
      screen: "LaporanTambatList",
      icon: "anchor",
      iconType: "feather",
      color: "#6610f2",
    },
  ];

  const renderActionCard = (item: QuickActionItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.actionCard}
      onPress={() => navigation.navigate(item.screen as any, item.params)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.actionIconContainer,
          { backgroundColor: item.color + "20" },
        ]}
      >
        <Icon
          name={item.icon}
          type={item.iconType}
          size={24}
          color={item.color}
        />
      </View>
      <Text style={styles.actionTitle} numberOfLines={2}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar
              size={60}
              rounded
              title={getUserInitials(session.user.email || "")}
              containerStyle={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.welcomeText}>Selamat Datang</Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {session.user.email}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Account", { session })}
          >
            <Icon name="settings" type="feather" size={24} color="#6c757d" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="activity" type="feather" size={20} color="#28a745" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Aktivitas Hari Ini</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="clock" type="feather" size={20} color="#ffc107" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((item, index) => renderActionCard(item, index))}
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dokumen & Kejadian</Text>
          <View style={styles.actionsGrid}>
            {documentActions.map((item, index) =>
              renderActionCard(item, index)
            )}
          </View>
        </View>

        {/* Reports Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Laporan</Text>
          <View style={styles.actionsGrid}>
            {reportActions.map((item, index) => renderActionCard(item, index))}
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutContainer}>
          <Button
            title="Keluar"
            onPress={signOut}
            buttonStyle={styles.signOutButton}
            titleStyle={styles.signOutText}
            icon={{
              name: "log-out",
              type: "feather",
              color: "#dc3545",
              size: 18,
            }}
            type="outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    backgroundColor: "#007bff",
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: "#6c757d",
  },
  userEmail: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  actionCard: {
    width: (width - 56) / 2, // 2 columns with spacing
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    textAlign: "center",
    lineHeight: 18,
  },
  signOutContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  signOutButton: {
    borderColor: "#dc3545",
    borderWidth: 1,
    backgroundColor: "transparent",
    borderRadius: 8,
    height: 48,
  },
  signOutText: {
    color: "#dc3545",
    marginLeft: 8,
    fontWeight: "600",
  },
});

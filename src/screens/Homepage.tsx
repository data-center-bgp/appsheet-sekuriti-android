import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  Animated,
  PanResponder,
} from "react-native";
import { Text, Card, Button, Icon, Avatar } from "@rneui/themed";
import { useState, useRef, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackScreenProps } from "../types/navigation";

const { width, height } = Dimensions.get("window");

type Props = RootStackScreenProps<"Home">;

interface QuickActionItem {
  title: string;
  screen: string;
  icon: string;
  iconType: string;
  color: string;
  params?: any;
}

interface MenuOption {
  title: string;
  icon: string;
  action: () => void;
  color?: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
}

export default function Homepage({ route, navigation }: Props) {
  const { session } = route.params;
  const [showMenu, setShowMenu] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    fetchUserProfile();
  }, [session]);

  useEffect(() => {
    if (showMenu) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showMenu]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // Fallback to email if profile fetch fails
        setUserProfile({
          id: session.user.id,
          full_name: null,
          email: session.user.email || "",
        });
      } else {
        setUserProfile({
          id: data.id,
          full_name: data.full_name,
          email: session.user.email || "",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      // Fallback to email
      setUserProfile({
        id: session.user.id,
        full_name: null,
        email: session.user.email || "",
      });
    } finally {
      setLoading(false);
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return (
        gestureState.dy > 0 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
      );
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100 || gestureState.vy > 0.5) {
        closeMenu();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const openMenu = () => {
    setShowMenu(true);
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowMenu(false);
    });
  };

  const signOut = async () => {
    Alert.alert(
      "Konfirmasi Keluar",
      "Apakah Anda yakin ingin keluar dari aplikasi?",
      [
        {
          text: "Batal",
          style: "cancel",
        },
        {
          text: "Keluar",
          style: "destructive",
          onPress: async () => {
            closeMenu();
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  const getUserInitials = (name: string) => {
    if (!name) return "??";

    const names = name.trim().split(" ");
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  const getDisplayName = () => {
    if (loading) return "Loading...";
    if (userProfile?.full_name) return userProfile.full_name;
    return userProfile?.email || "User";
  };

  const menuOptions: MenuOption[] = [
    {
      title: "Pengaturan Akun",
      icon: "user",
      action: () => {
        closeMenu();
        navigation.navigate("Account", { session });
      },
      color: "#007bff",
    },
    {
      title: "Keluar",
      icon: "log-out",
      action: signOut,
      color: "#dc3545",
    },
  ];

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

  const renderMenuOption = (option: MenuOption, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuOption}
      onPress={option.action}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.menuIconContainer,
          { backgroundColor: (option.color || "#6c757d") + "20" },
        ]}
      >
        <Icon
          name={option.icon}
          type="feather"
          size={20}
          color={option.color || "#6c757d"}
        />
      </View>
      <Text
        style={[
          styles.menuOptionText,
          option.color === "#dc3545" && styles.menuOptionDanger,
        ]}
      >
        {option.title}
      </Text>
      <Icon name="chevron-right" type="feather" size={16} color="#6c757d" />
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
              title={getUserInitials(getDisplayName())}
              containerStyle={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.welcomeText}>Selamat Datang</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {getDisplayName()}
              </Text>
              {userProfile?.full_name && (
                <Text style={styles.userEmail} numberOfLines={1}>
                  {userProfile.email}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton} onPress={openMenu}>
            <Icon
              name="more-vertical"
              type="feather"
              size={24}
              color="#6c757d"
            />
          </TouchableOpacity>
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
      </ScrollView>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="none"
        onRequestClose={closeMenu}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeMenu}
          />

          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Menu</Text>
              <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                <Icon name="x" type="feather" size={20} color="#6c757d" />
              </TouchableOpacity>
            </View>

            {/* Menu Options */}
            <View style={styles.sheetContent}>
              {menuOptions.map((option, index) =>
                renderMenuOption(option, index)
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: 16,
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
    width: (width - 56) / 2,
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
  // Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: height * 0.6,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#dee2e6",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  closeButton: {
    padding: 4,
  },
  sheetContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 2,
    marginHorizontal: 8,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#212529",
  },
  menuOptionDanger: {
    color: "#dc3545",
  },
});

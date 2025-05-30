import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Card, Button } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackScreenProps } from "../types/navigation";

type Props = RootStackScreenProps<"Home">;

export default function Homepage({ route, navigation }: Props) {
  const { session } = route.params;
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text h3 style={styles.welcome}>
          Welcome, {session.user.email}
        </Text>
        <View style={styles.cardContainer}>
          <Card containerStyle={styles.card}>
            <Card.Title>Recent Activity</Card.Title>
            <Card.Divider />
            <Text style={styles.cardText}>You have no recent activity.</Text>
          </Card>

          <Card containerStyle={styles.card}>
            <Card.Title>Quick Actions</Card.Title>
            <Card.Divider />
            <Button
              title="Pengaturan"
              type="outline"
              onPress={() => navigation.navigate("Account", { session })}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Barang Masuk"
              type="outline"
              onPress={() => navigation.navigate("BarangMasukList")}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Barang Keluar"
              type="outline"
              onPress={() => navigation.navigate("BarangKeluarList")}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Orang Masuk"
              type="outline"
              onPress={() => navigation.navigate("OrangMasukList")}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Orang Keluar"
              type="outline"
              onPress={() => navigation.navigate("OrangKeluarList")}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Surat Masuk"
              type="outline"
              onPress={() => navigation.navigate("SuratMasukList")}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Surat Keluar"
              type="outline"
              onPress={() => navigation.navigate("SuratKeluarList")}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Form Kejadian"
              type="outline"
              onPress={() => navigation.navigate("FormKejadianList")}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Laporan Bunker/Fresh Water"
              type="outline"
              onPress={() => navigation.navigate("LaporanBunkerFreshWaterList")}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Laporan Mobil Tangki Fuel"
              type="outline"
              onPress={() => navigation.navigate("LaporanMobilTangkiFuelList")}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Laporan Travo/Blower"
              type="outline"
              onPress={() => navigation.navigate("LaporanTravoBlowerList")}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Laporan Tambat"
              type="outline"
              onPress={() => navigation.navigate("LaporanTambatList")}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Sign Out"
              onPress={signOut}
              type="outline"
              containerStyle={styles.buttonContainer}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flexGrow: 1,
    padding: 12,
  },
  welcome: {
    padding: 16,
    textAlign: "center",
  },
  cardContainer: {
    gap: 16,
    flex: 1,
  },
  card: {
    borderRadius: 8,
    marginHorizontal: 0,
  },
  cardText: {
    marginBottom: 10,
    textAlign: "center",
  },
  buttonContainer: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
});

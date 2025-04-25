import { View, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Text, Card, Button } from "@rneui/themed";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export default function Homepage({ session }: { session: Session }) {
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
              title="Lihat Profil"
              type="outline"
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Pengaturan"
              type="outline"
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

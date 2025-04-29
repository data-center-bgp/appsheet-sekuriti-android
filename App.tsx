import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import Homepage from "./components/Homepage";
import Account from "./components/Account";
import BarangMasukList from "./components/BarangMasukList";
import { View } from "react-native";
import { Session } from "@supabase/supabase-js";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        {session && session.user ? (
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={Homepage}
              initialParams={{ session }}
            />
            <Stack.Screen
              name="Account"
              component={Account}
              initialParams={{ session }}
            />
            <Stack.Screen
              name="BarangMasukList"
              component={BarangMasukList}
              options={{ title: "Daftar Barang Masuk" }}
            />
          </Stack.Navigator>
        ) : (
          <Auth />
        )}
      </View>
    </NavigationContainer>
  );
}

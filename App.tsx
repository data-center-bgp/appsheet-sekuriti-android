import { useState, useEffect } from "react";
import { supabase } from "./src/lib/supabase";
import Auth from "./src/screens/auth/Auth";
import Homepage from "./src/screens/Homepage";
import Account from "./src/screens/account/Account";
import BarangMasukList from "./src/screens/barang/masuk/BarangMasukList";
import { View } from "react-native";
import { Session } from "@supabase/supabase-js";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./src/types/navigation";
import BarangMasukCreate from "./src/screens/barang/masuk/BarangMasukCreate";
import BarangKeluarList from "./src/screens/barang/keluar/BarangKeluarList";
import BarangKeluarCreate from "./src/screens/barang/keluar/BarangKeluarCreate";
import OrangMasukList from "./src/screens/orang/masuk/OrangMasukList";
import OrangMasukCreate from "./src/screens/orang/masuk/OrangMasukCreate";
import OrangKeluarList from "./src/screens/orang/keluar/OrangKeluarList";
import OrangKeluarCreate from "./src/screens/orang/keluar/OrangKeluarCreate";
import SuratMasukList from "./src/screens/surat/masuk/SuratMasukList";
import SuratMasukCreate from "./src/screens/surat/masuk/SuratMasukCreate";
import SuratKeluarList from "./src/screens/surat/keluar/SuratKeluarList";
import SuratKeluarCreate from "./src/screens/surat/keluar/SuratKeluarCreate";
import FormKejadianList from "./src/screens/form/FormKejadianList";
import FormKejadianCreate from "./src/screens/form/FormKejadianCreate";
import LaporanBunkerFreshWaterList from "./src/screens/laporan/bunker_freshwater/LaporanBunkerFreshWaterList";
import LaporanBunkerFreshWaterCreate from "./src/screens/laporan/bunker_freshwater/LaporanBunkerFreshWaterCreate";
import LaporanMobilTangkiFuel from "./src/screens/laporan/mobil_tangki_fuel/LaporanMobilTangkiFuelList";
import LaporanMobilTangkiFuelCreate from "./src/screens/laporan/mobil_tangki_fuel/LaporanMobilTangkiFuelCreate";
import LaporanTravoBlowerList from "./src/screens/laporan/travo_blower/LaporanTravoBlowerList";
import LaporanTravoBlowerCreate from "./src/screens/laporan/travo_blower/LaporanTravoBlowerCreate";
import LaporanTambatList from "./src/screens/laporan/tambat/LaporanTambatList";
import LaporanTambatCreate from "./src/screens/laporan/tambat/LaporanTambatCreate";

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
            <Stack.Screen
              name="BarangMasukCreate"
              component={BarangMasukCreate}
              options={{ title: "Tambah Data Barang Masuk" }}
            />
            <Stack.Screen
              name="BarangKeluarList"
              component={BarangKeluarList}
              options={{ title: "Daftar Barang Keluar" }}
            />
            <Stack.Screen
              name="BarangKeluarCreate"
              component={BarangKeluarCreate}
              options={{ title: "Tambah Data Barang Keluar" }}
            />
            <Stack.Screen
              name="OrangMasukList"
              component={OrangMasukList}
              options={{ title: "Daftar Orang Masuk" }}
            />
            <Stack.Screen
              name="OrangMasukCreate"
              component={OrangMasukCreate}
              options={{ title: "Tambah Data Orang Masuk" }}
            />
            <Stack.Screen
              name="OrangKeluarList"
              component={OrangKeluarList}
              options={{ title: "Daftar Orang Keluar" }}
            />
            <Stack.Screen
              name="OrangKeluarCreate"
              component={OrangKeluarCreate}
              options={{ title: "Tambah Data Orang Keluar" }}
            />
            <Stack.Screen
              name="SuratMasukList"
              component={SuratMasukList}
              options={{ title: "Daftar Surat Masuk" }}
            />
            <Stack.Screen
              name="SuratMasukCreate"
              component={SuratMasukCreate}
              options={{ title: "Tambah Data Surat Masuk" }}
            />
            <Stack.Screen
              name="SuratKeluarList"
              component={SuratKeluarList}
              options={{ title: "Daftar Surat Keluar" }}
            />
            <Stack.Screen
              name="SuratKeluarCreate"
              component={SuratKeluarCreate}
              options={{ title: "Tambah Data Surat Keluar" }}
            />
            <Stack.Screen
              name="FormKejadianList"
              component={FormKejadianList}
              options={{ title: "Daftar Form Kejadian" }}
            />
            <Stack.Screen
              name="FormKejadianCreate"
              component={FormKejadianCreate}
              options={{ title: "Tambah Data Form Kejadian" }}
            />
            <Stack.Screen
              name="LaporanBunkerFreshWaterList"
              component={LaporanBunkerFreshWaterList}
              options={{ title: "Daftar Laporan Bunker/Fresh Water" }}
            />
            <Stack.Screen
              name="LaporanBunkerFreshWaterCreate"
              component={LaporanBunkerFreshWaterCreate}
              options={{ title: "Tambah Data Laporan Bunker/Fresh Water" }}
            />
            <Stack.Screen
              name="LaporanMobilTangkiFuelList"
              component={LaporanMobilTangkiFuel}
              options={{ title: "Daftar Laporan Mobil Tangki Fuel" }}
            />
            <Stack.Screen
              name="LaporanMobilTangkiFuelCreate"
              component={LaporanMobilTangkiFuelCreate}
              options={{ title: "Tambah Data Laporan Mobil Tangki Fuel" }}
            />
            <Stack.Screen
              name="LaporanTravoBlowerList"
              component={LaporanTravoBlowerList}
              options={{ title: "Daftar Laporan Travo/Blower" }}
            />
            <Stack.Screen
              name="LaporanTravoBlowerCreate"
              component={LaporanTravoBlowerCreate}
              options={{ title: "Tambah Data Laporan Travo/Blower" }}
            />
            <Stack.Screen
              name="LaporanTambatList"
              component={LaporanTambatList}
              options={{ title: "Daftar Laporan Tambat" }}
            />
            <Stack.Screen
              name="LaporanTambatCreate"
              component={LaporanTambatCreate}
              options={{ title: "Tambah Data Laporan Tambat" }}
            />
          </Stack.Navigator>
        ) : (
          <Auth />
        )}
      </View>
    </NavigationContainer>
  );
}

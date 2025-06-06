import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Session } from "@supabase/supabase-js";

export type RootStackParamList = {
  Home: { session: Session };
  Account: { session: Session };
  BarangMasukList: undefined;
  BarangMasukCreate: { editData?: any } | undefined;
  BarangKeluarList: undefined;
  BarangKeluarCreate: { editData?: any } | undefined;
  OrangMasukList: undefined;
  OrangMasukCreate: { editData?: any } | undefined;
  OrangKeluarList: undefined;
  OrangKeluarCreate: { editData?: any } | undefined;
  SuratMasukList: undefined;
  SuratMasukCreate: { editData?: any } | undefined;
  SuratKeluarList: undefined;
  SuratKeluarCreate: { editData?: any } | undefined;
  LaporanBunkerFreshWaterList: undefined;
  LaporanBunkerFreshWaterCreate: { editData?: any } | undefined;
  LaporanMobilTangkiFuelList: undefined;
  LaporanMobilTangkiFuelCreate: { editData?: any } | undefined;
  LaporanTravoBlowerList: undefined;
  LaporanTravoBlowerCreate: { editData?: any } | undefined;
  LaporanTambatList: undefined;
  LaporanTambatCreate: { editData?: any } | undefined;
  FormKejadianList: undefined;
  FormKejadianCreate: { editData?: any } | undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

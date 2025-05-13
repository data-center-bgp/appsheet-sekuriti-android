import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Session } from "@supabase/supabase-js";

export type RootStackParamList = {
  Home: { session: Session };
  Account: { session: Session };
  BarangMasukList: undefined;
  BarangMasukCreate: { editData?: any } | undefined;
  BarangKeluarList: undefined;
  BarangKeluarCreate: { editData?: any } | undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

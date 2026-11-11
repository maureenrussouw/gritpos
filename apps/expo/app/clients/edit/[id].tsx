import { View, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenHeader } from "@/components/ui/screen-header";
import { ClientForm } from "@/components/resource-forms/clients-form";
import { useClient, useUpdateClient } from "@/hooks/use-clients";

export default function EditClientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading } = useClient(id);
  const update = useUpdateClient();

  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader title="Edit Client" showBack />
      {isLoading || !item ? (
        <ActivityIndicator color="#6c5ce7" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <ClientForm
            initial={item}
            submitting={update.isPending}
            submitLabel="Save changes"
            onSubmit={async (values) => {
              await update.mutateAsync({ id, ...values });
              router.back();
            }}
          />
        </ScrollView>
      )}
    </View>
  );
}

import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/ui/screen-header";
import { ClientForm } from "@/components/resource-forms/clients-form";
import { useCreateClient } from "@/hooks/use-clients";

export default function CreateClientScreen() {
  const router = useRouter();
  const create = useCreateClient();
  return (
    <View className="flex-1 bg-[#F4F4F6] dark:bg-[#0a0a0f]">
      <ScreenHeader title="New Client" showBack />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <ClientForm
          submitting={create.isPending}
          submitLabel="Create Client"
          onSubmit={async (values) => {
            await create.mutateAsync(values);
            router.back();
          }}
        />
      </ScrollView>
    </View>
  );
}
